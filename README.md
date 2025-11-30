# ❤️ Vida: Tu Salud Acompañada (Family Health OS)

> **"Donde la Inteligencia Artificial se encuentra con el instinto materno."**

![Status](https://img.shields.io/badge/Status-Hackathon_MVP-success) ![Tech](https://img.shields.io/badge/AI-GPT4o_VLM-blue) ![Standard](https://img.shields.io/badge/Interoperability-HL7_FHIR-orange) ![Stack](https://img.shields.io/badge/Stack-React_Vite_Supabase-61DAFB)

## 📖 La Premisa (The Problem)

En el Perú, el sistema de salud está fragmentado y la "parálisis por incertidumbre" mata:

* **61.9%** de las personas no recibe atención médica cuando la necesita.
* **23.4%** recurre a farmacias sin evaluación clínica.
* La historia clínica vive en papeles, silos desconectados y la memoria frágil de los familiares.

Para un paciente con **Leucemia** o **Enfermedades Crónicas**, la falta de información centralizada durante la "Hora Dorada" (emergencia) puede ser fatal.

## 💡 La Solución: Vida

**Vida** no es solo una app; es un **Sistema Operativo Familiar de Salud** impulsado por IA. Centraliza la historia clínica, monitorea signos vitales en tiempo real y coordina a la familia mediante el agente **"Mamá"**.

### ✨ Principales "Momentos Ajá" (Features)

#### 1. 📸 Magic Onboarding (VLM & OCR 2.0)

*Adiós a la transcripción manual.*

* **Qué hace:** Toma una foto a esa receta médica arrugada, al resultado de laboratorio o a la caja del medicamento.
* **Cómo funciona:** Utilizamos **GPT-4o (Vision)** para interpretar semánticamente la imagen (incluso letra de médico ilegible), extraer entidades y estructurarlas automáticamente en el estándar **HL7 FHIR**.
* **Valor Inmediato:** En segundos, el caos de papeles se convierte en un calendario de medicación digital y una gráfica de tendencias.

#### 2. 💓 El Guardián Silencioso (Monitorización Pasiva)

*Protección 24/7 sin ansiedad.*

* **Qué hace:** Se conecta a wearables (Apple Watch/Garmin) para leer la **Variabilidad de la Frecuencia Cardíaca (HRV)**.
* **Cómo funciona:** Un modelo ligero detecta anomalías (caída de HRV + taquicardia) que predicen sepsis o crisis cardiacas horas antes de los síntomas visibles.
* **La Acción:** Si detecta riesgo ("Código Rojo"), activa el protocolo de emergencia familiar.

#### 3. 👩‍⚕️ Agente "Mamá": Tu Guía y Triaje

*Empatía escalable.*

* **Qué hace:** No es un buscador de síntomas. Es un triaje clínico basado en el **Protocolo de Manchester**.
* **Cómo funciona:** Analiza tus síntomas y tus datos históricos para darte una recomendación accionable: *"Toma un paracetamol"* (Verde) o *"Ve a urgencias ahora, ya pedí un Uber"* (Rojo).

#### 4. 🔗 Lazo Familiar (Family Loop)

*Nadie cuida solo.*

* Tablero compartido donde los hijos pueden ver: "¿Mamá tomó su pastilla?", "¿Cómo está su presión hoy?".
* **Alertas Twilio:** Llamadas automáticas a los cuidadores en caso de emergencia crítica.

---

## 🛠️ Stack Tecnológico (Arquitectura)

Nuestra arquitectura prioriza la **privacidad**, la **velocidad** y la **interoperabilidad**.

### Frontend (Este Repositorio)

* **Framework:** React 18 + TypeScript
* **Build Tool:** Vite
* **UI Library:** shadcn/ui + Tailwind CSS
* **Routing:** React Router v6
* **State Management:** 
  * React Query (TanStack Query) para estado del servidor
  * Context API para estado global (autenticación)
* **Form Handling:** React Hook Form + Zod
* **Backend as a Service:** Supabase (PostgreSQL + Auth + Storage)

### Backend

* **Backend:** Firebase Cloud Functions (ver `vida-app-backend`)
* **AI Core:**
  * **VLM:** GPT-4o para procesamiento de recetas e imágenes médicas
  * **NLP:** Agente "Mamá" con contexto de memoria a largo plazo
* **Base de Datos:** Supabase PostgreSQL con esquemas JSONB nativos para recursos **FHIR** (Patient, Observation, MedicationRequest)
* **Integraciones:** Twilio (SMS/Voz), HealthKit/Google Fit APIs

### Mobile

* **Frontend Mobile:** Flutter (ver `vida-app-frontend`)

---

## 🚀 Instalación y Despliegue (Local)

### Prerequisitos

* Node.js 20 o superior
* npm o yarn
* Cuenta de Supabase
* Variables de entorno configuradas

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/GeorgeTech20/mama-chat-interface.git
cd mama-chat-interface

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env.local en la raíz del proyecto
cp .env.example .env.local

# Editar .env.local con tus credenciales:
# VITE_SUPABASE_URL=tu_url_de_supabase
# VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en el navegador
# La aplicación estará disponible en http://localhost:8080
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en puerto 8080

# Producción
npm run build        # Construye la aplicación para producción
npm run preview      # Previsualiza el build de producción

# Calidad de código
npm run lint         # Ejecuta ESLint para verificar código
```

---

## 📁 Estructura del Proyecto

```
mama-chat-interface/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   └── ui/           # Componentes UI de shadcn
│   ├── pages/            # Páginas/rutas de la aplicación
│   ├── contexts/         # Context providers (AuthContext)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Integraciones externas
│   │   └── supabase/    # Cliente y tipos de Supabase
│   ├── lib/             # Utilidades y helpers
│   ├── types/           # Tipos TypeScript compartidos
│   └── assets/          # Imágenes, fuentes, etc.
├── supabase/            # Migraciones de base de datos
│   └── migrations/     # Archivos SQL de migración
├── public/              # Assets estáticos
└── package.json         # Dependencias del proyecto
```

---

## 🔐 Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica_anon

# Ejemplo:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Importante:** Nunca commitees archivos `.env` o `.env.local` al repositorio. Ya están incluidos en `.gitignore`.

---

## 🧪 Desarrollo

### Flujo de Trabajo

1. **Crear rama de desarrollo:**
   ```bash
   git checkout -b feature/nombre-de-la-feature
   ```

2. **Desarrollar y probar localmente:**
   ```bash
   npm run dev
   ```

3. **Verificar código:**
   ```bash
   npm run lint
   npm run build
   ```

4. **Hacer commit y push:**
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin feature/nombre-de-la-feature
   ```

5. **Crear Pull Request** en GitHub

Ver más detalles en [reglas-github.mdc](../.cursor/rules/reglas-github.mdc)

### Buenas Prácticas

Consulta las [reglas de desarrollo](../.cursor/rules/reglas-desarrollo.mdc) para:
* Convenciones de código
* Estructura de componentes
* Manejo de estado
* Integración con Supabase
* Y más...

---

## 🗄️ Base de Datos (Supabase)

### Migraciones

Las migraciones de la base de datos están en `supabase/migrations/`. Para aplicar migraciones:

```bash
# Usando Supabase CLI
supabase db push

# O desde el dashboard de Supabase
```

### Esquema Principal

El proyecto utiliza recursos **HL7 FHIR** almacenados en PostgreSQL:

* **profiles**: Perfiles de usuario y configuración
* **patients**: Información de pacientes
* **observations**: Signos vitales y observaciones clínicas
* **medication_requests**: Medicamentos y recetas
* **medical_files**: Archivos médicos y documentos

---

## 🔗 Integraciones

### Supabase

* Autenticación de usuarios
* Base de datos PostgreSQL
* Storage para archivos médicos
* Real-time subscriptions para actualizaciones en vivo

### Firebase Cloud Functions

El backend utiliza Firebase Cloud Functions para:
* Procesamiento de imágenes con GPT-4o Vision
* Lógica de negocio del agente "Mamá"
* Integraciones con Twilio

Ver el repositorio `vida-app-backend` para más detalles.

---

## 📱 Mobile App

La aplicación móvil está desarrollada en Flutter. Ver el repositorio `vida-app-frontend` para más información.

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es parte de un hackathon. Todos los derechos reservados.

---

## 👥 Equipo

Desarrollado con ❤️ para mejorar el acceso a la salud en el Perú.

---

## 📞 Soporte

Para preguntas o soporte, abre un issue en el repositorio de GitHub.

---

## 🚧 Estado del Proyecto

**Status:** 🟢 En Desarrollo Activo

Este es un MVP desarrollado durante un hackathon. Estamos trabajando activamente en nuevas funcionalidades y mejoras.

---

## 🙏 Agradecimientos

* OpenAI por GPT-4o Vision
* Supabase por la infraestructura backend
* La comunidad open source de React y Vite
* Todos los que contribuyen a mejorar la salud digital
