"""
Smart chunking strategies for different document types.
Financial tables get smaller chunks; legal docs split on section headers first.
"""

import re
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Regex patterns for financial table detection
FINANCIAL_TABLE_PATTERN = re.compile(
    r"(\$[\d,]+\.?\d*|\d+\.?\d*%|\d{1,3}(,\d{3})+)", re.MULTILINE
)

# Legal section headers for hierarchical splitting
LEGAL_SECTION_HEADERS = [
    r"(?:^|\n)(?:ARTICLE|Article)\s+[IVXLCDM\d]+",
    r"(?:^|\n)(?:SECTION|Section)\s+\d+",
    r"(?:^|\n)(?:WHEREAS|NOW, THEREFORE|IN WITNESS WHEREOF)",
    r"(?:^|\n)\d+\.\d+\s+[A-Z]",
]


def _is_financial_table(text: str) -> bool:
    """Detect if a chunk likely contains financial table data."""
    matches = FINANCIAL_TABLE_PATTERN.findall(text)
    # If more than 5 numeric/currency patterns in text, it's likely a table
    return len(matches) > 5


def _extract_section_header(text: str) -> str | None:
    """Try to extract a section header from the beginning of text."""
    lines = text.strip().split("\n")[:3]
    for line in lines:
        stripped = line.strip()
        # Match common heading patterns
        if re.match(r"^(ARTICLE|Article|SECTION|Section|PART|Part)\s+", stripped):
            return stripped[:100]
        if re.match(r"^(Item|ITEM)\s+\d", stripped):
            return stripped[:100]
        if re.match(r"^\d+\.\s+[A-Z]", stripped):
            return stripped[:100]
        # All-caps lines under 80 chars are likely headers
        if stripped.isupper() and len(stripped) < 80 and len(stripped) > 3:
            return stripped
    return None


class SmartChunker:
    """
    Context-aware text chunker that adapts strategy by document type:
    - Standard docs: chunk_size=1000, overlap=150
    - Financial tables: chunk_size=500 to preserve row integrity
    - Legal docs: split on section headers first, then recursively
    """

    DEFAULT_CHUNK_SIZE = 1000
    DEFAULT_CHUNK_OVERLAP = 150
    FINANCIAL_CHUNK_SIZE = 500
    FINANCIAL_CHUNK_OVERLAP = 100

    @classmethod
    def chunk_documents(cls, documents: list[Document]) -> list[Document]:
        """
        Split documents into chunks with metadata enrichment.
        Returns List[Document] with chunk_index, total_chunks, section_header.
        """
        if not documents:
            return []

        doc_type = documents[0].metadata.get("doc_type", "unknown")

        if doc_type == "legal_contract":
            chunks = cls._chunk_legal(documents)
        else:
            chunks = cls._chunk_standard(documents)

        # Add chunk indexing metadata
        total = len(chunks)
        for idx, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = idx
            chunk.metadata["total_chunks"] = total
            chunk.metadata["content_length"] = len(chunk.page_content)

            # Extract section header if not already set
            if "section_header" not in chunk.metadata or not chunk.metadata["section_header"]:
                chunk.metadata["section_header"] = _extract_section_header(chunk.page_content)

        return chunks

    @classmethod
    def _chunk_standard(cls, documents: list[Document]) -> list[Document]:
        """Standard + financial-aware chunking."""
        all_chunks = []

        for doc in documents:
            if _is_financial_table(doc.page_content):
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=cls.FINANCIAL_CHUNK_SIZE,
                    chunk_overlap=cls.FINANCIAL_CHUNK_OVERLAP,
                    separators=["\n\n", "\n", "|", " ", ""],
                    length_function=len,
                )
            else:
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=cls.DEFAULT_CHUNK_SIZE,
                    chunk_overlap=cls.DEFAULT_CHUNK_OVERLAP,
                    separators=["\n\n", "\n", ". ", " ", ""],
                    length_function=len,
                )

            chunks = splitter.split_documents([doc])
            all_chunks.extend(chunks)

        return all_chunks

    @classmethod
    def _chunk_legal(cls, documents: list[Document]) -> list[Document]:
        """
        Legal document chunking: split on section headers first,
        then apply recursive splitting within each section.
        """
        # Build combined legal separator pattern
        legal_separators = LEGAL_SECTION_HEADERS + ["\n\n", "\n", ". ", " ", ""]

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=cls.DEFAULT_CHUNK_SIZE,
            chunk_overlap=cls.DEFAULT_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )

        all_chunks = []
        for doc in documents:
            text = doc.page_content

            # First pass: split on legal section boundaries
            section_pattern = "|".join(LEGAL_SECTION_HEADERS)
            sections = re.split(section_pattern, text)

            for section in sections:
                if not section.strip():
                    continue

                # Create a temporary document for this section
                section_doc = Document(
                    page_content=section.strip(),
                    metadata={**doc.metadata},
                )

                # Extract header for this section
                header = _extract_section_header(section)
                if header:
                    section_doc.metadata["section_header"] = header

                # Second pass: recursive split within each section
                sub_chunks = splitter.split_documents([section_doc])
                all_chunks.extend(sub_chunks)

        return all_chunks
