import { seedMockFiles } from "../../../src/utils/mockAPI";
import { seedLexicalEmbeddings } from "../../../src/utils/embeddings";
import { getAPI } from "../../../src/utils/api";
import vault from "../data/real-vault.json";

const files = vault as Record<string, string>;
seedMockFiles(files);
seedLexicalEmbeddings(files);
void getAPI().setVaultPath("OO-Test-Vault");

