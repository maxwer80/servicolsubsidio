# Informe de escucha social – Público hispano de "video y publicidad con IA"
*Canal @JOHNBALCAZAR · Noviembre 2026*

## Ficha técnica
| | |
|---|---|
| **Corpus** | 1.732 comentarios públicos de 18 videos de YouTube (12 de la competencia y 6 propios) |
| **Analizados** | **1.434 comentarios del público**. Se excluyeron 298 escritos por los creadores. |
| **Método** | Análisis de contenido con un libro de códigos de 11 categorías, más emoción, polaridad y nivel del usuario. Codificación asistida por IA en 4 lotes paralelos con el mismo protocolo. |
| **Validación** | ⏳ **Pendiente.** Hay una muestra aleatoria de 100 comentarios en `datos/muestra_validacion.csv` para que la codifiques a mano y calculemos el kappa de Cohen. |
| **Archivos** | `datos/comentarios.csv` (datos crudos) · `datos/comentarios_codificados.csv` (datos codificados) |

### Limitaciones (léelas antes de citar cifras)
- **Sesgo de canal:** el 42% de los comentarios viene de Adrián Sáenz, cuyo público es más general ("ganar dinero"). Lo que se ve está inclinado hacia su audiencia.
- **Autoselección:** quien comenta no representa a todos los que ven. Comentan más los muy entusiastas y los frustrados.
- **Nivel del usuario:** en el 84% de los comentarios no se puede saber si es principiante o avanzado.
- **"OTRO" = 13%:** aparecieron temas fuera del libro de códigos (ver el final). En la próxima ronda se agregan como códigos.
- Las fechas son aproximadas, y los "likes" miden acuerdo del público, no frecuencia.

---

## Resultados generales

**Polaridad:** 51% positiva · 38% neutra · 11% negativa.
**Emociones:** curiosidad 27% · entusiasmo 22% · gratitud 21% · humor 8% · **frustración 7%** · desconfianza 3% · miedo 1%.

### Frecuencia de temas
Se excluyen los elogios, que son 704 menciones. Un comentario puede tener 2 códigos.

| Tema | Menciones | Likes acumulados* | Lectura |
|---|---|---|---|
| **DUD** – Dudas de "cómo se hace" | 259 | 130 | La necesidad más frecuente: **pasos concretos** |
| **PED** – Piden contenido | 142 | 397 | Con mucho apoyo en likes: piden **cursos completos** |
| **D-COS** – Dolor de costo | 110 | 98 | Más frecuente que el dolor técnico |
| **MON** – Monetización | 100 | 279 | El cuello de botella es **vender**, no producir |
| **COMP** – Comparan herramientas | 98 | 175 | ChatGPT vs. Claude, Higgsfield vs. otras |
| **D-TEC** – Dolor técnico | 73 | 48 | Consistencia de personajes y productos |
| **ESC** – Escepticismo | 66 | 105 | Desconfianza hacia los tutoriales incompletos |
| **ETI** – Miedo o ética | 43 | **398** | Pocos comentarios, pero **los más apoyados** |

*Likes sumados de los comentarios cuyo código principal es ese tema.

### Diferencias por nivel del usuario
- **Principiantes (143):** sobre todo **DUD** ("¿dónde está…?", "¿qué prompt subo?") y **D-COS** ("¿es gratis?").
- **Avanzados (88):** **D-TEC** (fidelidad del producto, control de la toma), **COMP** y **MON**.

---

## 7 hallazgos clave

### 1. 🔑 El cuello de botella es VENDER, no producir (tu mayor oportunidad)
El público ya ve que producir con IA es posible. Lo que no sabe es **cómo convertirlo en dinero**.
> *"Molaría que subieras un video de cómo vender este tipo de productos… lo que marca la diferencia es saber venderlo"* — **76 likes**
> *"Es justamente eso lo que necesito para poder facturar. No soy bueno a la hora de saber venderlo."* — 13 likes
> *"Cuánto te costó y en cuánto lo vendes?"*

Los propios usuarios proponen estrategias: *"currarse 1–2 videos por sector… ir a los locales con videos de muestra"*. **Ningún competidor enseña a vender con método.** Es exactamente tu formación: comunicación, marketing y comportamiento del consumidor.

### 2. El tutorial incompleto destruye la confianza
En el video de influencer IA de Lorena Bordonaba, **decenas de comentarios** preguntan por el mismo paso que falta (el "Gem" de Gemini):
> *"Creo que te guardas información… no me mantiene esa consistencia de la que hablas"* — **49 likes**
> *"y cual é la Gem"* — 25 likes · *"COMO Y DONDE SE CONFIGURA LA GEMA"* — 21 likes
> *"Lo hace a posta para generar comentarios"* — 12 likes

Al revés, la transparencia se premia:
> *"Nunca había escuchado una explicación tan profesional, siempre ocultan info"* — 12 likes (Scalboost)

👉 **Hay que entregar todo**: prompts, archivos y cada paso. "No me guardo nada" es una promesa diferenciadora.

### 3. El costo preocupa más que la técnica
Hay 110 menciones de costo frente a 73 técnicas. Hacen cuentas y buscan alternativas:
> *"El tema que siempre da miedo es que diga se acabó los tokens"* — 39 likes
> *"Lo que queremos es otras alternativas con descuentos o GRATIS"*
> *"¿Claude Code es GRATIS? ¿Tiene límites?"* · *"¿Hay una estrategia un poco más económica?"*

👉 Contenido de **costos reales por proyecto** y de **cómo gastar menos créditos**.

### 4. Hay demanda explícita de un curso completo
> *"Adri necesitamos curso completo de Higgsfield 🙏🏻"* — **210 likes** (el pedido más apoyado de todo el corpus)
> *"Necesitamos un curso completo de esto, y aún más a detalle"* — 19 likes
> *"¿Tienes alguna comunidad o curso paso a paso?"*

👉 Hay un producto validado a futuro: un **curso o comunidad**. Pero solo funciona con la confianza de los hallazgos 2 y 5.

### 5. El motor emocional es el miedo a quedarse atrás (y es un público vulnerable)
Son los comentarios con más likes del corpus:
> *"Debo aprender Claude para hacerme rico antes de quedarme sin trabajo"* — **224 likes**
> *"Tengo 40, me quedé desactualizada… desempleada y con una bebé en casa, quiero aprender dónde puedo trabajar online"* — **131 likes**
> *"Cada vez siento que no aprender IA es como quedarse analfabeto"* — **110 likes**
> *"Estudié diseño gráfico toda mi vida y ya no hay laburo 😢"* — 17 likes

👉 El público busca **seguridad económica**, no solo herramientas. **Ética:** es un público vulnerable, así que nada de promesas de "hacerte rico". Lo honesto vende mejor aquí: es la diferencia con los "vendehumo".

### 6. Duda sobre si lo hecho con IA le sirve a la marca
> *"La gente se da cuenta que es IA… es como una mancha para la marca"* — 6 likes
> *"Ya cualquier red social avisa de contenido con IA (he escuchado que te bajan el alcance)"* — 7 likes

En el canal "No es X es Y", decenas de comentarios intentan **detectar si el presentador es IA**.
👉 Es una pregunta de **comportamiento del consumidor** que nadie responde con datos: **tema perfecto para tu tesis** y para videos con autoridad.

### 7. Tu propio canal: lo que valoran y lo que critican
- **Valoran:** *"directo al grano y muy útil"*, *"me encanta este paso a paso y aprender haciendo"*, *"Vine buscando plata y encontré oro"* (Argentina). También comentan desde Honduras y Nicaragua: tu público es **latinoamericano**, no solo colombiano.
- **Critican:** *"Aburrido! Y lento"* (5 likes) en el en vivo de After Effects de 37 min. **El ritmo importa.**
- **Cuidado:** varios piden descargas piratas de Photoshop o Premiere. No respondas eso (riesgo de strike).

---

## Implicaciones para el canal

### Posicionamiento ajustado con los datos
> **"Aprende a hacer y VENDER publicidad con IA. Paso a paso, con costos reales y sin guardarme nada."**

### 4 pilares de contenido
| Pilar | Responde a | Ejemplo de video |
|---|---|---|
| **1. Tutorial completo** (con archivos y prompts) | DUD, ESC (hallazgos 2 y 4) | "Comercial con IA de principio a fin: te dejo TODOS los prompts" |
| **2. Costos reales** | D-COS (hallazgo 3) | "¿Cuánto me costó y en cuánto lo vendí?" |
| **3. Cómo vender a negocios** ⭐ (tu diferencial) | MON (hallazgo 1) | "Cómo le vendí un comercial con IA a un negocio de barrio" |
| **4. Consumidor e IA** (tu tesis) | ETI y la autenticidad (hallazgo 6) | "¿La gente confía en un anuncio hecho con IA? Hice el experimento" |

### Ganchos con el lenguaje textual del público (para los shorts)
- "¿Cuánto me costó y en cuánto lo vendí?"
- "No me guardo nada: aquí están todos los prompts"
- "¿Se te acaban los créditos antes de terminar el video?"
- "Sé hacer el video, pero no sé venderlo"
- "¿La gente se da cuenta de que es IA?"
- "¿Se puede hacer gratis?"
- "Estudié diseño y ya no hay trabajo: esto hice"

---

## Mejoras al libro de códigos (para la próxima ronda)
Nuevos códigos que surgieron en "OTRO":
- **AYU:** ayuda entre usuarios.
- **EXP:** experiencia propia de uso o resultados.
- **DET-IA:** intento de detectar si algo es IA.
- **APAR:** comentarios sobre la apariencia del creador.
- **CONF:** confusión o "me perdí".
- **SERV:** pide asesoría pagada (un **lead** potencial).

## Siguiente paso: validación
1. Abre `datos/muestra_validacion.csv` (100 comentarios).
2. Codifica `tu_codigo1` (y `tu_codigo2` si aplica) con el libro de códigos, **sin mirar** el archivo codificado.
3. Devuélvemelo y calculo el % de acuerdo y el **kappa de Cohen**. Con **κ ≥ 0,7** los hallazgos quedan validados para usarlos con confianza (y en tu tesis).
