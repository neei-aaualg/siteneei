// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackup } from '../scripts/backup-db.js';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SQLite Backup & Integrity (createBackup)', () => {
  const tempDir = path.resolve(__dirname, '../data/test-backup-tmp');
  const tempDbPath = path.join(tempDir, 'test-source.db');
  const tempTargetPath = path.join(tempDir, 'test-target.db');

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('cria com sucesso um snapshot atómico e valida a integridade', () => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Cria uma base de dados SQLite de teste
    const db = new DatabaseSync(tempDbPath);
    db.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
      INSERT INTO users (name) VALUES ('Test Student');
    `);
    db.close();

    const result = createBackup({
      sourcePath: tempDbPath,
      targetPath: tempTargetPath,
      verbose: false,
    });

    expect(result.ok).toBe(true);
    expect(fs.existsSync(tempTargetPath)).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(0);

    // Verifica que os dados no backup estão intactos
    const backupDb = new DatabaseSync(tempTargetPath, { readOnly: true });
    const rows = backupDb.prepare('SELECT * FROM users;').all();
    backupDb.close();

    expect(rows).toEqual([{ id: 1, name: 'Test Student' }]);
  });

  it('lança erro se a base de dados de origem não existir', () => {
    expect(() =>
      createBackup({
        sourcePath: path.join(tempDir, 'non-existent.db'),
        targetPath: tempTargetPath,
        verbose: false,
      })
    ).toThrow(/Base de dados de origem não encontrada/);
  });
});
