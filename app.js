function formatearPrecio(num) {
  return Number(num).toLocaleString("es-AR");
}

const configDefault = {
  nombre: "catalogo",
  telefono: "5493516869573",
  heroBadge: "Categoría general",
  heroTitulo: "Título general",
  heroSubtitulo: "Descripción destacada del negocio o de una promoción importante.",
  servicioTitulo: "Categoría o servicio destacado",
  servicioTexto1: "Texto descriptivo general del servicio o del negocio.",
  servicioTexto2: "Podés usar este bloque para explicar beneficios, tipo de atención o detalles importantes.",
  servicioPrecio: "Promo destacada o precio base",
  servicioBoxTitulo: "Texto comercial destacado",
  servicioBoxTexto: "Descripción corta para invitar a consultar, comprar o pedir presupuesto.",
  mostrarBotonInteresa: "si",
  mostrarBotonOferta: "si",
  textoBotonInteresa: "Me interesa",
  textoBotonOferta: "Hacer oferta",
  tooltipInteresa: "Abre WhatsApp con un mensaje para consultar este producto.",
  tooltipOferta: "Te permite escribir una oferta por este producto antes de enviar el mensaje."
};

let config = { ...configDefault };

const modal = document.getElementById("modalImagen");
const imagenModal = document.getElementById("imagenModal");
const cerrarModal = document.getElementById("cerrarModal");
const contenedor = document.getElementById("productos");

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(value => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).trim();
    }
    return value;
  });
}

function valorBooleano(valor) {
  const v = String(valor || "").trim().toLowerCase();
  return v === "si" || v === "sí" || v === "true" || v === "1";
}

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el && valor !== undefined && valor !== null) {
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

  if (config.heroTitulo) {
    document.title = config.heroTitulo;
  }
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

if (cerrarModal) {
  cerrarModal.addEventListener("click", cerrarModalImagen);
}

if (modal) {
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      cerrarModalImagen();
    }
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modal && modal.classList.contains("activo")) {
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
  const res = await fetch("config.csv?v=" + Date.now());
  const texto = await res.text();

  const lineas = texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l !== "");

  lineas.forEach(linea => {
    const partes = parseCSVLine(linea);
    const clave = partes[0];
    const valor = partes.slice(1).join(",").trim();

    if (clave) {
      config[clave] = valor;
    }
  });

  aplicarConfigEnPantalla();
}

function crearBoton(claseBoton, textoBoton, tooltipTexto, onClick) {
  const wrapper = document.createElement("div");
  wrapper.className = "tooltip";
  wrapper.setAttribute("data-tooltip", tooltipTexto || "");

  const button = document.createElement("button");
  button.className = claseBoton;
  button.textContent = textoBoton;
  button.onclick = onClick;

  wrapper.appendChild(button);
  return wrapper;
}

async function cargarProductos() {
  const res = await fetch("productos.csv?v=" + Date.now());
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

  const mostrarInteresa = valorBooleano(config.mostrarBotonInteresa);
  const mostrarOferta = valorBooleano(config.mostrarBotonOferta);

  lineas.forEach(function (linea) {
    const partes = parseCSVLine(linea);

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

    const titulo = document.createElement("h3");
    titulo.textContent = nombre;

    const precioEl = document.createElement("div");
    precioEl.className = "precio";
    precioEl.textContent = "$" + formatearPrecio(precio);

    const estadoEl = document.createElement("div");
    estadoEl.className = "estado";
    estadoEl.textContent = estado;

    const acciones = document.createElement("div");
    acciones.className = "acciones";

    let cantidadBotones = 0;

    if (mostrarInteresa) {
      cantidadBotones++;
      acciones.appendChild(
        crearBoton(
          "btn-interesa",
          config.textoBotonInteresa || "Me interesa",
          config.tooltipInteresa || "",
          function () {
            enviarWhatsApp(nombre, precio, estado, "consulta");
          }
        )
      );
    }

    if (mostrarOferta) {
      cantidadBotones++;
      acciones.appendChild(
        crearBoton(
          "btn-oferta",
          config.textoBotonOferta || "Hacer oferta",
          config.tooltipOferta || "",
          function () {
            enviarWhatsApp(nombre, precio, estado, "oferta");
          }
        )
      );
    }

    if (cantidadBotones === 2) {
      acciones.classList.add("dos-botones");
    } else {
      acciones.classList.add("un-boton");
    }

    body.appendChild(titulo);
    body.appendChild(precioEl);
    body.appendChild(estadoEl);

    if (cantidadBotones > 0) {
      body.appendChild(acciones);
    }

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
    aplicarConfigEnPantalla();
    await cargarConfig();
    await cargarProductos();
  } catch (error) {
    console.error("Error al cargar archivos:", error);
    contenedor.innerHTML = '<div class="sin-productos">No se pudieron cargar los archivos del sitio.</div>';
  }
}

iniciar();
