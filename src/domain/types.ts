export type Title = {
    id: number;
    title: string;
};

export type Document = Title & { content: string };

export type Chunk = {
    docId: number;
    index: number; // position within the document
    text: string;
};

export type EmbeddedChunk = Chunk & {
    embedding: number[];
};

export type Answer = {
    text: string;
    citations: { docId: number; index: number }[];
};
