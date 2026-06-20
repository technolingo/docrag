interface DocumentRepository {
    getDocument(id: number): Document | undefined;
    getAllTitles(): Title[];
    createDocument(title: string, content: string): Document;
    updateDocument(id: number, title?: string, content?: string): Document | undefined;
    deleteDocument(id: number): number | undefined;
}

type Title = {
    id: number,
    title: string,
}

type Document = Title & {content: string}

class InMemoryDocumentRepository implements DocumentRepository {
    private currDocIdx = 0;
    private documents = new Map<number, Document>;

    getDocument(id: number): Document | undefined {
        return this.documents.get(id);
    }

    getAllTitles(): Title[] {
        return Array.from(this.documents.values(), (doc) => ({
            id: doc.id,
            title: doc.title,
        }))
    }

    updateDocument(id: number, title?: string, content?: string): Document | undefined {
        const orig = this.getDocument(id);
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

    createDocument(title: string, content: string): Document {
        const id = ++this.currDocIdx;
        const doc: Document = {id, title, content}  // shorthand when keys & values have the same name
        this.documents.set(id, doc);
        return doc;
    }

    deleteDocument(id: number): number | undefined {
        const orig = this.getDocument(id);
        if (!orig) {
            return undefined;
        }

        this.documents.delete(id);

        return id;
    }
}
