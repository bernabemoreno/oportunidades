function formatearPrecio(num) {
  return Number(num).toLocaleString("es-AR");
}

let numeroWhatsApp = "5493516869573";
let nombreConfig = "ventas";

const modal = document.getElementById("modalImagen");
const imagenModal = document.getElementById("imagenModal");
const cerrarModal = document.getElementById("cerrarModal");
const contenedor = document.getElementById("productos");

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
  const numero = (numeroWhatsApp || "").replace(/\D/g, "") || "5493516869573";
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

  if (!lineas.length) {
    return;
  }

  const partes = lineas[0].split(",").map(x => x.trim());

  if (partes.length >= 2) {
    nombreConfig = partes[0];
    numeroWhatsApp = partes[1];
  }
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

iniciar();