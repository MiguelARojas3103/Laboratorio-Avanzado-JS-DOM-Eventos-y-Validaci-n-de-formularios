// =====================================================
// Tarea 4 · Validación de formularios del lado cliente
// Inscripción a cursos · FISC · UTP
// JS puro, sin librerías.
// =====================================================

const form = document.querySelector('#inscripcion');
const confirmacion = document.querySelector('#confirmacion');
const campoSede = document.querySelector('#campo-sede');
const sede = document.querySelector('#sede');
const nacimiento = document.querySelector('#nacimiento');
const comentarios = document.querySelector('#comentarios');
const contador = document.querySelector('#comentarios-contador');
const fuerzaBarra = document.querySelector('#fuerza-barra');
const fuerzaLbl = document.querySelector('#fuerza-lbl');

const MAX_COMENTARIOS = 200;
const AVISO_COMENTARIOS = 180;
const EDAD_MINIMA = 16;

// ---------- Utilidades ----------

// Convierte "AAAA-MM-DD" en una fecha local (new Date('AAAA-MM-DD') la toma en UTC
// y en Panamá (UTC-5) daría el día anterior).
function fechaLocal(valor) {
  const [a, m, d] = valor.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function hoySinHora() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

// Fecha límite: hoy menos 16 años (pista del enunciado)
function fechaLimite() {
  const limite = hoySinHora();
  limite.setFullYear(limite.getFullYear() - EDAD_MINIMA);
  return limite;
}

function calcularEdad(fecha) {
  const hoy = hoySinHora();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const aunNoCumple =
    hoy.getMonth() < fecha.getMonth() ||
    (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate());
  if (aunNoCumple) edad--;
  return edad;
}

// El calendario nativo no deja elegir fechas futuras (capa 1: atributo max)
const hoy = hoySinHora();
nacimiento.max = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

// ---------- Reglas (capa 3) ----------
// Cada regla recibe el valor y devuelve true o el mensaje de error.

const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';
const reNombre = new RegExp(`^[${LETRAS}]+(?: [${LETRAS}]+)+$`);

const reglas = {
  nombre: v => {
    const limpio = v.trim().replace(/\s+/g, ' ');
    if (!limpio) return 'Escribe tu nombre y apellido.';
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(limpio)) return 'Usa solo letras (se permiten tildes y ñ).';
    if (!reNombre.test(limpio)) return 'Escribe tu nombre y apellido.';
    if (limpio.length < 5 || limpio.length > 60) return 'Debe tener entre 5 y 60 caracteres.';
    return true;
  },

  cedula: v =>
    /^([1-9]|1[0-3]|PE|E|N)-\d{1,4}-\d{1,6}$/i.test(v.trim()) || 'Usa el formato 8-123-4567.',

  correo: v => {
    if (!v.trim()) return 'Escribe tu correo electrónico.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Usa un correo como nombre@dominio.com.';
  },

  celular: v =>
    /^6\d{3}-?\d{4}$/.test(v.trim()) || 'El celular debe tener 8 dígitos y empezar con 6.',

  nacimiento: v => {
    if (!v) return 'Indica tu fecha de nacimiento.';
    const fecha = fechaLocal(v);
    if (Number.isNaN(fecha.getTime())) return 'Fecha no válida.';
    if (fecha > hoySinHora()) return 'La fecha no puede ser futura.';
    if (fecha > fechaLimite()) return `Debes tener al menos ${EDAD_MINIMA} años.`;
    return true;
  },

  curso: v => v !== '' || 'Elige un curso.',

  modalidad: v => v !== '' || 'Elige una modalidad.',

  // Solo se valida si el campo está visible (modalidad presencial)
  sede: v => v !== '' || 'Elige una sede.',

  clave: v => {
    const falta = [];
    if (v.length < 8) falta.push('8 caracteres');
    if (!/[A-Z]/.test(v)) falta.push('una mayúscula');
    if (!/[a-z]/.test(v)) falta.push('una minúscula');
    if (!/\d/.test(v)) falta.push('un número');
    if (!/[^A-Za-z0-9\s]/.test(v)) falta.push('un símbolo');
    return falta.length === 0 || `Te falta: ${falta.join(', ')}.`;
  },

  clave2: v => {
    if (!v) return 'Confirma tu contraseña.';
    return v === form.clave.value || 'Las contraseñas no coinciden.';
  },

  comentarios: v => v.length <= MAX_COMENTARIOS || `Máximo ${MAX_COMENTARIOS} caracteres.`,

  terminos: v => v === true || 'Debes aceptar los términos.',
};

// ---------- Validación (una sola función para todos los campos) ----------

// Devuelve el valor según el tipo de control
function valorDe(campo) {
  if (campo.type === 'checkbox') return campo.checked;
  if (campo.type === 'radio') return form.elements[campo.name].value; // RadioNodeList
  return campo.value;
}

// Todos los controles que comparten el nombre (un radio group tiene varios)
function controlesDe(nombre) {
  return [...form.querySelectorAll(`[name="${nombre}"]`)];
}

function validarCampo(campo) {
  const nombre = campo.name;
  const resultado = reglas[nombre](valorDe(campo));
  const valido = resultado === true;
  const error = document.getElementById(`${nombre}-error`);

  controlesDe(nombre).forEach(c => c.setAttribute('aria-invalid', String(!valido)));
  error.textContent = valido ? '' : resultado;
  return valido;
}

// Un campo participa si tiene regla y no está deshabilitado (sede oculta)
function esValidable(el) {
  return Boolean(reglas[el.name]) && !el.disabled;
}

function limpiarEstado(nombre) {
  controlesDe(nombre).forEach(c => c.removeAttribute('aria-invalid'));
  const error = document.getElementById(`${nombre}-error`);
  if (error) error.textContent = '';
}

// ---------- Comportamientos extra ----------

// Modalidad: muestra/oculta la sede
function actualizarSede() {
  const presencial = form.elements.modalidad.value === 'presencial';
  campoSede.hidden = !presencial;
  sede.disabled = !presencial;       // deshabilitado = no se valida ni se envía
  sede.required = presencial;
  if (!presencial) {
    sede.value = '';
    tocados.delete('sede');
    limpiarEstado('sede');
  }
}

// Indicador de fuerza de la contraseña
function actualizarFuerza(v) {
  let puntos = 0;
  if (v.length >= 8) puntos++;
  if (v.length >= 12) puntos++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) puntos++;
  if (/\d/.test(v)) puntos++;
  if (/[^A-Za-z0-9\s]/.test(v)) puntos++;
  const niveles = [
    ['—', '0%', 'var(--error)'],
    ['Muy débil', '20%', 'var(--error)'],
    ['Débil', '40%', 'var(--error)'],
    ['Aceptable', '60%', 'var(--aviso)'],
    ['Buena', '80%', 'var(--ok)'],
    ['Fuerte', '100%', 'var(--ok)'],
  ];
  const [texto, ancho, color] = v ? niveles[puntos] : niveles[0];
  fuerzaBarra.style.width = ancho;
  fuerzaBarra.style.background = color;
  fuerzaLbl.textContent = `Fuerza: ${texto}`;
}

// Contador de comentarios en vivo ("143 / 200")
function actualizarContador() {
  const n = comentarios.value.length;
  contador.textContent = `${n} / ${MAX_COMENTARIOS}`;
  contador.classList.toggle('cerca', n > AVISO_COMENTARIOS && n <= MAX_COMENTARIOS);
  contador.classList.toggle('excedido', n > MAX_COMENTARIOS);
}

// ---------- Patrón 3.4: al salir, luego en vivo, todo al enviar ----------

const tocados = new Set();

// 1) Primera validación al salir del campo. blur no burbujea: fase de captura.
form.addEventListener('blur', (e) => {
  const campo = e.target;
  if (!esValidable(campo)) return;
  // En un grupo de radios, salir de un radio para ir al otro no cuenta como "salir"
  if (campo.type === 'radio' && e.relatedTarget?.name === campo.name) return;
  tocados.add(campo.name);
  validarCampo(campo);
}, true);

// 2) Desde que fue tocado, se revalida en cada cambio
form.addEventListener('input', (e) => {
  const campo = e.target;

  if (campo.name === 'clave') {
    actualizarFuerza(campo.value);
    // La confirmación se revalida también cuando cambia la contraseña
    if (tocados.has('clave2')) validarCampo(form.clave2);
  }
  if (campo.name === 'comentarios') actualizarContador();

  if (esValidable(campo) && tocados.has(campo.name)) validarCampo(campo);
});

// Radios, selects y checkbox confirman con change
form.addEventListener('change', (e) => {
  const campo = e.target;
  if (campo.name === 'modalidad') {
    actualizarSede();
    tocados.add('modalidad');
    validarCampo(campo);
    return;
  }
  if (campo.type === 'checkbox') tocados.add(campo.name);
  if (esValidable(campo) && tocados.has(campo.name)) validarCampo(campo);
});

// 3) Al enviar: se valida todo y el foco va al primer error
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Un control por nombre (los radios comparten nombre), en orden del documento
  const vistos = new Set();
  const campos = [...form.elements].filter(el => {
    if (!esValidable(el) || vistos.has(el.name)) return false;
    vistos.add(el.name);
    return true;
  });

  campos.forEach(el => tocados.add(el.name));
  const invalidos = campos.filter(el => !validarCampo(el));

  if (invalidos.length) {
    confirmacion.textContent = '';
    invalidos[0].focus();
    return;
  }

  mostrarConfirmacion(new FormData(form));
  form.reset();
});

// Reiniciar el estado visual cuando se limpia el formulario
form.addEventListener('reset', () => {
  // reset cambia los valores después de este evento; se espera un ciclo
  setTimeout(() => {
    tocados.clear();
    Object.keys(reglas).forEach(limpiarEstado);
    actualizarSede();
    actualizarFuerza('');
    actualizarContador();
  });
});

// ---------- Tarjeta de confirmación (createElement + textContent) ----------

function mostrarConfirmacion(datos) {
  const cursoTexto = form.curso.selectedOptions[0].textContent;
  const fecha = fechaLocal(datos.get('nacimiento'));
  const fechaTexto = fecha.toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric' });
  const celular = datos.get('celular').replace(/^(\d{4})-?(\d{4})$/, '$1-$2');
  const modalidad = datos.get('modalidad');

  const filas = [
    ['Nombre', datos.get('nombre').trim().replace(/\s+/g, ' ')],
    ['Cédula', datos.get('cedula').trim().toUpperCase()],
    ['Correo', datos.get('correo').trim()],
    ['Celular', celular],
    ['Nacimiento', `${fechaTexto} (${calcularEdad(fecha)} años)`],
    ['Curso', cursoTexto],
    ['Modalidad', modalidad === 'presencial' ? 'Presencial' : 'Virtual'],
  ];
  if (modalidad === 'presencial') filas.push(['Sede', datos.get('sede')]);
  const coment = datos.get('comentarios').trim();
  if (coment) filas.push(['Comentarios', coment]);
  // La contraseña nunca se muestra

  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';

  const titulo = document.createElement('h2');
  titulo.textContent = '¡Inscripción registrada!';

  const envio = document.createElement('p');
  envio.className = 'fecha-envio';
  envio.textContent = `Enviado el ${new Date().toLocaleString('es-PA')}`;

  const dl = document.createElement('dl');
  for (const [etiqueta, valor] of filas) {
    const dt = document.createElement('dt');
    dt.textContent = etiqueta;
    const dd = document.createElement('dd');
    dd.textContent = valor;           // nunca innerHTML con datos del usuario
    dl.append(dt, dd);
  }

  tarjeta.append(titulo, envio, dl);
  confirmacion.textContent = '';
  confirmacion.append(tarjeta);
  tarjeta.setAttribute('tabindex', '-1');
  tarjeta.focus();
}
