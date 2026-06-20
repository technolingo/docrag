interface DocumentRepository {
    getDocument(id: number): Promise<Document | undefined>;
    getAllTitles(): Promise<Title[]>;
    createDocument(title: string, content: string): Promise<Document>;
    updateDocument(id: number, title?: string, content?: string): Promise<Document | undefined>;
    deleteDocument(id: number): Promise<number | undefined>;
}

type Title = {
    id: number,
    title: string,
}

type Document = Title & {content: string}

class InMemoryDocumentRepository implements DocumentRepository {
    private currDocIdx = 0;
    private documents = new Map<number, Document>;

    async getDocument(id: number): Promise<Document | undefined> {
        return this.documents.get(id);
    }

    async getAllTitles(): Promise<Title[]> {
        return Array.from(this.documents.values(), (doc) => ({
            id: doc.id,
            title: doc.title,
        }))
    }

    async createDocument(title: string, content: string): Promise<Document> {
        const id = ++this.currDocIdx;
        const doc: Document = {id, title, content}  // shorthand when keys & values have the same name
        this.documents.set(id, doc);
        return doc;
    }

    async updateDocument(id: number, title?: string, content?: string): Promise<Document | undefined> {
        const orig = await this.getDocument(id);
        if (!orig) {
            return undefined;
        }

        const updated: Document = {
            ...orig,
            title: title ?? orig.title,
            content: content ?? orig.content,
        }

        this.documents.set(id, updated);
        return updated;
    }

    async deleteDocument(id: number): Promise<number | undefined> {
        const orig = await this.getDocument(id);
        if (!orig) {
            return undefined;
        }

        this.documents.delete(id);

        return id;
    }
}
