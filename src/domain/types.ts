export type Title = {
    id: number;
    title: string;
};

export type Document = Title & { content: string };

export type Chunk = {};

export type EmbeddedChunk = Chunk & {
    embedding: number[];
};
