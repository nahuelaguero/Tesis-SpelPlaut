const puppeteer = require("puppeteer");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOTS_DIR = path.join(
  __dirname,
  "..",
  "docs",
  "images",
  "screenshots-kranhfield"
);

const ADMIN_CREDENTIALS = {
  email: "admin@lomaplata.com",
  password: "admin123",
};

const KRANHFIELD_DATA = {
  nombre: "Kranhfield",
  descripcion:
    "Cancha de Futbol 5 con pasto sintetico de alta calidad en Loma Plata. Propiedad de Leander Krahn. Iluminacion nocturna LED y estacionamiento.",
  tipo_cancha: "Football5",
  ubicacion: "Krahnfield, Loma Plata, Boqueron, Paraguay",
  precio_por_hora: "100000",
  capacidad_jugadores: "10",
  horario_apertura: "07:00",
  horario_cierre: "22:00",
};

async function takeScreenshots() {
  console.log("Iniciando captura de screenshots...");
  console.log(`URL base: ${BASE_URL}`);
  console.log(`Directorio: ${SCREENSHOTS_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    protocolTimeout: 120000,
  });

  const page = await browser.newPage();

  try {
    // 1. Screenshot de la pagina de login
    console.log("1/7 - Navegando al login...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "load", timeout: 120000 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-login-page.png"),
      fullPage: true,
    });
    console.log("   Screenshot: 01-login-page.png");

    // 2. Login como admin
    console.log("2/7 - Iniciando sesion como admin...");
    await page.type('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.type('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-login-filled.png"),
      fullPage: true,
    });
    console.log("   Screenshot: 02-login-filled.png");

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "load", timeout: 120000 });
    console.log("   Login exitoso");

    // 3. Navegar al panel de administracion de canchas
    console.log("3/7 - Navegando al panel de canchas...");
    await page.goto(`${BASE_URL}/admin/canchas`, {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-admin-canchas-list.png"),
      fullPage: true,
    });
    console.log("   Screenshot: 03-admin-canchas-list.png");

    // 4. Navegar al formulario de nueva cancha
    console.log("4/7 - Navegando al formulario de nueva cancha...");
    await page.goto(`${BASE_URL}/admin/canchas/nueva`, {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector('input[name="nombre"]', { timeout: 10000 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-form-empty.png"),
      fullPage: true,
    });
    console.log("   Screenshot: 04-form-empty.png");

    // 5. Completar el formulario con datos de Kranhfield
    console.log("5/7 - Completando formulario con datos de Kranhfield...");

    await page.type('input[name="nombre"]', KRANHFIELD_DATA.nombre);
    await page.type('textarea[name="descripcion"]', KRANHFIELD_DATA.descripcion);
    await page.select('select[name="tipo_cancha"]', KRANHFIELD_DATA.tipo_cancha);
    await page.type('input[name="ubicacion"]', KRANHFIELD_DATA.ubicacion);
    await page.type(
      'input[name="precio_por_hora"]',
      KRANHFIELD_DATA.precio_por_hora
    );
    await page.type(
      'input[name="capacidad_jugadores"]',
      KRANHFIELD_DATA.capacidad_jugadores
    );

    // Limpiar y setear horarios
    await page.click('input[name="horario_apertura"]', { clickCount: 3 });
    await page.type(
      'input[name="horario_apertura"]',
      KRANHFIELD_DATA.horario_apertura
    );
    await page.click('input[name="horario_cierre"]', { clickCount: 3 });
    await page.type(
      'input[name="horario_cierre"]',
      KRANHFIELD_DATA.horario_cierre
    );

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-form-filled.png"),
      fullPage: true,
    });
    console.log("   Screenshot: 05-form-filled.png");

    // 6. Enviar el formulario
    console.log("6/7 - Enviando formulario...");
    await page.click('button[type="submit"]');

    // Esperar el mensaje de exito o redireccion
    await page.waitForFunction(
      () => {
        const successMsg = document.querySelector(".bg-green-50");
        const errorMsg = document.querySelector(".bg-red-50");
        return successMsg || errorMsg;
      },
      { timeout: 15000 }
    );

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-form-submitted.png"),
      fullPage: true,
    });
    console.log("   Screenshot: 06-form-submitted.png");

    // 7. Ver Kranhfield en el listado publico
    console.log("7/7 - Navegando al listado publico de canchas...");
    await page.goto(`${BASE_URL}/canchas`, { waitUntil: "load", timeout: 120000 });
    await new Promise((r) => setTimeout(r, 2000)); // Esperar carga de datos
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-canchas-public-list.png"),
      fullPage: true,
    });
    console.log("   Screenshot: 07-canchas-public-list.png");

    console.log("\nTodos los screenshots capturados exitosamente!");
    console.log(`Directorio: ${SCREENSHOTS_DIR}`);
  } catch (error) {
    console.error("Error durante la captura:", error.message);

    // Tomar screenshot del error
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "error-state.png"),
      fullPage: true,
    });
    console.log("Screenshot del estado de error guardado");
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);
