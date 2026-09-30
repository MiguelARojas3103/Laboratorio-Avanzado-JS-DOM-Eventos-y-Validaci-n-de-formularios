// =====================================================
// Laboratorio: DOM, eventos y validación de formularios
// Miguel Rojas y Jose Rozette · Ingeniería Web · UTP
// =====================================================

// ---------- PARTE 1 · EL DOM ----------

// 1.1 Seleccionar elementos
const titulo = document.querySelector('#titulo');     // primer elemento que coincide
const items  = document.querySelectorAll('li');       // NodeList con todos

console.log(titulo.textContent);
items.forEach(li => console.log(li.textContent));

// 1.2 Cambiar texto, clases y atributos
titulo.textContent = '¡Hola DOM!';                   // texto seguro
titulo.classList.add('destacado');                    // add / remove / toggle / contains
titulo.setAttribute('title', 'Encabezado');
titulo.dataset.estado = 'activo';                     // crea data-estado="activo"
titulo.style.color = 'steelblue';                     // estilo en línea (úsalo poco)

// 1.3 Crear y eliminar nodos
const lista = document.querySelector('#lista');
const lenguajes = ['HTML', 'CSS', 'JavaScript'];

for (const nombre of lenguajes) {
  const li = document.createElement('li');
  li.textContent = nombre;
  lista.append(li);                                   // lo agrega al final
}

lista.lastElementChild.remove();                      // elimina "JavaScript"

// Pregunta de control 1: querySelector devuelve null si no encuentra nada
console.log('querySelector(".inexistente") →', document.querySelector('.inexistente'));
console.log('Lectura segura con ?. →', document.querySelector('.inexistente')?.textContent);


// ---------- PARTE 2 · EVENTOS ----------

// 2.1 addEventListener y el objeto event
const boton = document.querySelector('#saludar');

boton.addEventListener('click', (event) => {
  console.log(event.type);     // "click"
  console.log(event.target);   // el elemento que recibió el clic
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') console.log('Cerrar modal');
});

// 2.2 Delegación de eventos
// (se llama listaTareas porque "lista" ya se declaró en la parte 1.3)
const listaTareas = document.querySelector('#tareas');

listaTareas.addEventListener('click', (e) => {
  const borrar = e.target.closest('.borrar');
  if (borrar) {
    borrar.closest('li').remove();
    return;
  }
  const texto = e.target.closest('.texto');
  if (texto) texto.closest('li').classList.toggle('hecha');
});

// Agregar tareas nuevas: funcionan sin registrar manejadores extra (delegación)
const formTarea = document.querySelector('#form-tarea');
const nuevaTarea = document.querySelector('#nueva-tarea');

formTarea.addEventListener('submit', (e) => {
  e.preventDefault();
  const valor = nuevaTarea.value.trim();
  if (!valor) return;
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.className = 'texto';
  span.textContent = valor;                            // textContent: seguro ante XSS
  const btn = document.createElement('button');
  btn.className = 'borrar';
  btn.type = 'button';
  btn.textContent = '×';
  li.append(span, ' ', btn);
  listaTareas.append(li);
  nuevaTarea.value = '';
});

// 2.3 preventDefault
// (se llama formDemo porque "form" se usa en la parte 3)
const formDemo = document.querySelector('#form-demo');

formDemo.addEventListener('submit', (e) => {
  e.preventDefault();                                  // no recargar la página
  const datos = new FormData(formDemo);
  console.log(Object.fromEntries(datos));
});


// ---------- PARTE 3 · VALIDACIÓN DE FORMULARIOS ----------

const form = document.querySelector('#registro');

// 3.2 API de validación del navegador
const correo = document.querySelector('#correo');

console.log('checkValidity():', correo.checkValidity());       // true / false
console.log('valueMissing:', correo.validity.valueMissing);     // true si required y está vacío
console.log('typeMismatch:', correo.validity.typeMismatch);     // true si no parece un correo
console.log('patternMismatch:', correo.validity.patternMismatch); // true si no cumple pattern
console.log('tooShort:', correo.validity.tooShort);             // true si no llega a minlength

// Marcar un error propio (cadena vacía = válido)
correo.setCustomValidity('Ese correo ya está registrado');
console.log('Con error propio:', correo.validationMessage);
correo.setCustomValidity('');                                   // se limpia para seguir probando

// 3.3 Reglas propias, reutilizables
const reglas = {
  nombre: v => v.trim().length >= 3 || 'Escribe al menos 3 caracteres.',
  correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Usa un correo como nombre@dominio.com.',
  cedula: v => /^([1-9]|1[0-3]|PE|E|N)-\d{1,4}-\d{1,6}$/.test(v) || 'Formato: 8-123-4567.',
  clave:  v => (v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v))
               || 'Mínimo 8 caracteres, una mayúscula y un número.',
  clave2: v => v === form.clave.value || 'Las contraseñas no coinciden.',
};

function validarCampo(input) {
  const resultado = reglas[input.name](input.value);
  const valido = resultado === true;
  const error = document.getElementById(`${input.name}-error`);

  input.setAttribute('aria-invalid', String(!valido));
  error.textContent = valido ? '' : resultado;
  return valido;
}

// Resumen que se muestra al enviar (creado con createElement + textContent)
function mostrarResumen(datos) {
  const resumen = document.querySelector('#resumen');
  resumen.textContent = '';
  const h3 = document.createElement('h3');
  h3.textContent = 'Cuenta creada (sin recargar la página)';
  const ul = document.createElement('ul');
  for (const [campo, valor] of datos) {
    if (campo.startsWith('clave')) continue;           // nunca mostrar contraseñas
    const li = document.createElement('li');
    li.textContent = `${campo}: ${valor}`;
    ul.append(li);
  }
  resumen.append(h3, ul);
  resumen.hidden = false;
  console.log('Enviado:', Object.fromEntries(datos));
}

// 3.4 Cuándo mostrar los errores
const tocados = new Set();

form.addEventListener('blur', (e) => {
  if (!reglas[e.target.name]) return;
  tocados.add(e.target.name);
  validarCampo(e.target);
}, true);   // true = fase de captura (blur no burbujea)

form.addEventListener('input', (e) => {
  if (tocados.has(e.target.name)) validarCampo(e.target);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const campos = [...form.elements].filter(el => reglas[el.name]);
  const invalidos = campos.filter(el => !validarCampo(el));
  if (invalidos.length) { invalidos[0].focus(); return; }
  mostrarResumen(new FormData(form));
  form.reset();
  tocados.clear();
  campos.forEach(el => el.removeAttribute('aria-invalid'));
});
