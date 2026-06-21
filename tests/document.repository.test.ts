import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDocumentRepository } from '../src/repositories/document.repository.ts';

describe('InMemoryDocumentRepository', () => {
    let repo: InMemoryDocumentRepository;

     // setUp: ensures test func-level isolation
    beforeEach(() => {
        repo = new InMemoryDocumentRepository();
    });

    it('assigns sequential ids starting at 1', async () => {
        const first = await repo.createDocument('First Title', 'body one');
        const second = await repo.createDocument('Second Title', 'body two');
        assert.equal(first.id, 1);
        assert.equal(second.id, 2);
    });

    it('returns a stored document by id', async () => {
        const created = await repo.createDocument('First Title', 'body one');
        const retrieved = await repo.getDocument(created.id);
        assert.deepEqual(retrieved, created);
    });

    it('returns undefined for an unknown id', async () => {
        assert.equal(await repo.getDocument(999), undefined);
    });

    it('lists titles without content', async () => {
        await repo.createDocument('Title A', 'content a');
        await repo.createDocument('Title B', 'content b');
        const titles = await repo.getAllTitles();
        assert.deepEqual(titles, [
            { id: 1, title: 'Title A' },
            { id: 2, title: 'Title B' },
        ]);
    });

    it('updates only the provided fields, leaving others intact', async () => {
        const doc = await repo.createDocument('Original', 'original content');
        const updated = await repo.updateDocument(doc.id, 'New Title'); // content omitted
        assert.equal(updated?.title, 'New Title');
        assert.equal(updated?.content, 'original content'); // the `??` fallback in repo
    });

    it('returns undefined when updating a missing document', async () => {
        assert.equal(await repo.updateDocument(42, 'x'), undefined);
    });

    it('deletes a document and reports the removed id', async () => {
        const doc = await repo.createDocument('To Delete', 'goodbye');
        assert.equal(await repo.deleteDocument(doc.id), doc.id);
        assert.equal(await repo.getDocument(doc.id), undefined);
    });
});
