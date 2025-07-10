import { initializeDatabase } from "./database";

async function init() {
  try {
    console.log("Inicializando banco de dados...");
    await initializeDatabase();
    console.log("Banco de dados inicializado com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    process.exit(1);
  }
}

init();
