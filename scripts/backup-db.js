import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cria uma cópia consistente e atómica da base de dados SQLite usando VACUUM INTO.
 * Valida a integridade do ficheiro gerado através de PRAGMA integrity_check.
 *
 * @param {Object} [options]
 * @param {string} [options.sourcePath] Caminho para a base de dados de origem.
 * @param {string} [options.targetPath] Caminho para o ficheiro de backup de destino.
 * @param {boolean} [options.verbose] Se deve imprimir mensagens na consola.
 */
export function createBackup({
  sourcePath = process.env.DATABASE_PATH || path.resolve(__dirname, '../data/activities.db'),
  targetPath = undefined,
  verbose = true,
} = {}) {
  const startTime = Date.now();

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`[BACKUP ERROR] Base de dados de origem não encontrada: ${sourcePath}`);
  }

  // Se não for especificado caminho de destino, gera um timestamped em data/backups/
  if (!targetPath) {
    const backupDir = path.resolve(__dirname, '../data/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    targetPath = path.join(backupDir, `activities-snapshot-${timestamp}.db`);
  }

  // Assegura que o diretório de destino existe
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Se o ficheiro de destino já existir, remove-o previamente para o VACUUM INTO não falhar
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }

  if (verbose) {
    console.log(`[BACKUP] A iniciar snapshot atómico...`);
    console.log(`[BACKUP] Origem:  ${sourcePath}`);
    console.log(`[BACKUP] Destino: ${targetPath}`);
  }

  // Executa snapshot via VACUUM INTO
  let sourceDb;
  try {
    sourceDb = new DatabaseSync(sourcePath);
    // Escapa apóstrofos no caminho para evitar injeção
    const safeTargetPath = targetPath.replace(/'/g, "''");
    sourceDb.exec(`VACUUM INTO '${safeTargetPath}';`);
  } finally {
    if (sourceDb) {
      try {
        sourceDb.close();
      } catch (e) {
        // Ignora erro no fecho
      }
    }
  }

  // Verifica se o ficheiro foi criado
  if (!fs.existsSync(targetPath)) {
    throw new Error(
      `[BACKUP ERROR] Ficheiro de destino não foi criado após VACUUM INTO: ${targetPath}`
    );
  }

  // Valida a integridade do ficheiro exportado
  let checkDb;
  try {
    checkDb = new DatabaseSync(targetPath, { readOnly: true });
    const checkResult = checkDb.prepare('PRAGMA integrity_check;').all();
    const isOk =
      Array.isArray(checkResult) &&
      checkResult.length === 1 &&
      checkResult[0]?.integrity_check === 'ok';

    if (!isOk) {
      // Remove ficheiro corrompido
      try {
        fs.unlinkSync(targetPath);
      } catch (e) {
        // Ignora
      }
      throw new Error(
        `[BACKUP ERROR] Falha na verificação de integridade do snapshot: ${JSON.stringify(checkResult)}`
      );
    }
  } finally {
    if (checkDb) {
      try {
        checkDb.close();
      } catch (e) {
        // Ignora
      }
    }
  }

  const stats = fs.statSync(targetPath);
  const elapsedMs = Date.now() - startTime;

  const result = {
    ok: true,
    sourcePath,
    targetPath,
    sizeBytes: stats.size,
    sizeHuman: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
    elapsedMs,
    timestamp: new Date().toISOString(),
  };

  if (verbose) {
    console.log(`[BACKUP OK] Snapshot concluído com sucesso em ${elapsedMs}ms!`);
    console.log(`[BACKUP OK] Tamanho: ${result.sizeHuman} (${result.sizeBytes} bytes)`);
    console.log(`[BACKUP OK] Integridade: OK`);
  }

  return result;
}

// Execução direta via CLI: `node scripts/backup-db.js [targetPath] [--json]`
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const targetArg = args.find((a) => !a.startsWith('--'));

  try {
    const res = createBackup({
      targetPath: targetArg,
      verbose: !jsonMode,
    });
    if (jsonMode) {
      console.log(JSON.stringify(res));
    }
    process.exit(0);
  } catch (err) {
    if (jsonMode) {
      console.error(JSON.stringify({ ok: false, error: err.message }));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}
