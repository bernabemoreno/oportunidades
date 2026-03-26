function formatearPrecio(num) {
  return Number(num).toLocaleString("es-AR");
}

const config = {
  nombre: "ventas",
  telefono: "5493516869573",
  heroBadge: "Ventas y oportunidades",
  heroTitulo: "Oportunidades en tecnología",
  heroSubtitulo: "Equipos, accesorios y servicio técnico. Elegí lo que te interesa y consultame directo por WhatsApp.",
  servicioTitulo: "💻 Reparación de PC y notebooks",
  servicioTexto1: "Presupuesto sin cargo, atención personalizada y soluciones claras.",
  servicioTexto2: "Instalaciones, optimización, limpieza, revisión general y más.",
  servicioPrecio: "Limpieza desde $20.000",
  servicioBoxTitulo: "Consultá tu equipo sin compromiso",
  servicioBoxTexto: "Podés escribir directo por WhatsApp para revisar tu caso o pedir presupuesto."
};

const modal = document.getElementById("modalImagen");
const imagenModal = document.getElementById("imagenModal");
const cerrarModal = document.getElementById("cerrarModal");
const contenedor = document.getElementById("productos");

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el && valor) {
    el.textContent = valor;
  }
}

function aplicarConfigEnPantalla() {
  setTexto("heroBadge", config.heroBadge);
  setTexto("heroTitulo", config.heroTitulo);
  setTexto("heroSubtitulo", config.heroSubtitulo);
  setTexto("servicioTitulo", config.servicioTitulo);
  setTexto("servicioTexto1", config.servicioTexto1);
  setTexto("servicioTexto2", config.servicioTexto2);
  setTexto("servicioPrecio", config.servicioPrecio);
  setTexto("servicioBoxTitulo", config.servicioBoxTitulo);
  setTexto("servicioBoxTexto", config.servicioBoxTexto);
}

function abrirModal(src, alt) {
  imagenModal.src = src;
  imagenModal.alt = alt || "Imagen del producto";
  modal.classList.add("activo");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function cerrarModalImagen() {
  modal.classList.remove("activo");
  modal.setAttribute("aria-hidden", "true");
  imagenModal.src = "";
  document.body.style.overflow = "";
}

cerrarModal.addEventListener("click", cerrarModalImagen);

modal.addEventListener("click", function (e) {
  if (e.target === modal) {
    cerrarModalImagen();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modal.classList.contains("activo")) {
    cerrarModalImagen();
  }
});

function enviarWhatsApp(nombre, precio, estado, tipo) {
  const numero = (config.telefono || "").replace(/\D/g, "") || "5493516869573";
  let mensaje = "";

  if (tipo === "oferta") {
    const oferta = prompt("Ingresá tu oferta para " + nombre);
    if (!oferta) return;

    mensaje =
      "Hola, quiero hacer una oferta por " + nombre +
      ". Precio publicado: $" + formatearPrecio(precio) +
      ". Estado: " + estado +
      ". Mi oferta es: $" + oferta + ".";
  } else {
    mensaje =
      "Hola, me interesa " + nombre +
      ". Precio publicado: $" + formatearPrecio(precio) +
      ". Estado: " + estado +
      ". ¿Sigue disponible?";
  }

  const url = "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensaje);
  window.open(url, "_blank");
}

async function cargarConfig() {
  const res = await fetch("config.csv");
  const texto = await res.text();

  const lineas = texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l !== "");

  lineas.forEach(linea => {
    const coma = linea.indexOf(",");
    if (coma === -1) return;

    const clave = linea.slice(0, coma).trim();
    const valor = linea.slice(coma + 1).trim();

    if (clave && valor && Object.prototype.hasOwnProperty.call(config, clave)) {
      config[clave] = valor;
    }
  });

  aplicarConfigEnPantalla();
}

async function cargarProductos() {
  const res = await fetch("productos.csv");
  const texto = await res.text();

  const lineas = texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l !== "");

  contenedor.innerHTML = "";

  if (!lineas.length) {
    contenedor.innerHTML = '<div class="sin-productos">No hay productos cargados todavía.</div>';
    return;
  }

  lineas.forEach(function (linea) {
    const partes = linea.split(",").map(x => x.trim());
    const nombre = partes[0];
    const precio = partes[1];
    const estado = partes[2];
    const imagen = partes[3];

    if (!nombre || !precio || !estado || !imagen) {
      return;
    }

    const card = document.createElement("article");
    card.className = "card";

    const imagenWrap = document.createElement("div");
    imagenWrap.className = "imagen-wrap";
    imagenWrap.title = "Click para ver la imagen en tamaño completo";

    const img = document.createElement("img");
    const rutaImagen = new URL(imagen, window.location.href).href;
    img.src = rutaImagen;
    img.alt = nombre;
    img.loading = "lazy";
    img.onerror = function () {
      this.src = "https://via.placeholder.com/900x600?text=Sin+imagen";
    };

    imagenWrap.appendChild(img);
    imagenWrap.addEventListener("click", function () {
      abrirModal(rutaImagen, nombre);
    });

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML =
      '<h3>' + nombre + '</h3>' +
      '<div class="precio">$' + formatearPrecio(precio) + '</div>' +
      '<div class="estado">' + estado + '</div>' +
      '<div class="acciones">' +
        '<div class="tooltip" data-tooltip="Abre WhatsApp con un mensaje para consultar este producto">' +
          '<button class="btn-interesa">Me interesa</button>' +
        '</div>' +
        '<div class="tooltip" data-tooltip="Te permite escribir una oferta por este producto antes de enviar el mensaje">' +
          '<button class="btn-oferta">Hacer oferta</button>' +
        '</div>' +
      '</div>';

    body.querySelector(".btn-interesa").onclick = function () {
      enviarWhatsApp(nombre, precio, estado, "consulta");
    };

    body.querySelector(".btn-oferta").onclick = function () {
      enviarWhatsApp(nombre, precio, estado, "oferta");
    };

    card.appendChild(imagenWrap);
    card.appendChild(body);
    contenedor.appendChild(card);
  });

  if (!contenedor.children.length) {
    contenedor.innerHTML = '<div class="sin-productos">No se pudieron mostrar productos. Revisá el formato del CSV.</div>';
  }
}

async function iniciar() {
  try {
    await cargarConfig();
    await cargarProductos();
  } catch (error) {
    console.error("Error al cargar archivos:", error);
    contenedor.innerHTML = '<div class="sin-productos">No se pudieron cargar los archivos del sitio.</div>';
  }
}

aplicarConfigEnPantalla();
iniciar();
