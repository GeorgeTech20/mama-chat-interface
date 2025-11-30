# Guía de Testing - Chat con Persistencia

## ✅ Estado de Implementación

### Fase 1: Base de Datos ✅
- [x] Migración: `20251130000001_add_reliability_score_to_medical_files.sql`
- [x] Migración: `20251130000002_create_conversations_table.sql`
- [x] Migración: `20251130000003_create_chat_messages_table.sql`

### Fase 2: Tipos y Hooks ✅
- [x] Tipos TypeScript actualizados (`Conversation`, `ChatMessage`, `BotResponse`)
- [x] Hook `useConversation` creado
- [x] Hook `useChatMessages` creado

### Fase 3: Integración ✅
- [x] Componente `Chat.tsx` actualizado con persistencia
- [x] Guardado de mensajes en base de datos
- [x] Carga de mensajes desde base de datos
- [x] Procesamiento de respuesta JSON del bot
- [x] Scroll infinito para paginación

---

## 🚀 Pasos para Probar

### 1. Aplicar Migraciones a Supabase

**IMPORTANTE**: Las migraciones deben aplicarse a tu base de datos de Supabase antes de probar.

```bash
# Si usas Supabase CLI localmente
supabase db reset

# O aplicar migraciones manualmente desde el dashboard de Supabase
# Ve a: SQL Editor > New Query > Pega cada migración y ejecuta
```

**Migraciones a aplicar en orden:**
1. `20251130000001_add_reliability_score_to_medical_files.sql`
2. `20251130000002_create_conversations_table.sql`
3. `20251130000003_create_chat_messages_table.sql`

### 2. Regenerar Tipos de Supabase (Opcional)

Después de aplicar las migraciones, regenera los tipos TypeScript:

```bash
# Si tienes Supabase CLI configurado
supabase gen types typescript --local > src/integrations/supabase/types.ts

# O desde el dashboard de Supabase:
# Settings > API > Generate TypeScript types
```

**Nota**: Por ahora el código funciona sin regenerar tipos, pero es recomendable para tener autocompletado completo.

### 3. Verificar Variables de Entorno

Asegúrate de tener configurado `.env.local`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=tu_key_publica
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

### 5. Probar Funcionalidad

#### Prueba 1: Primer Mensaje (Creación Automática de Conversación)
1. Abre la aplicación en el navegador
2. Navega a la página de Chat
3. Envía un mensaje (ej: "Hola")
4. **Verificar**:
   - ✅ Se crea automáticamente la conversación
   - ✅ Aparece el mensaje de bienvenida del bot
   - ✅ Aparece tu mensaje
   - ✅ Aparece la respuesta del bot

#### Prueba 2: Persistencia de Mensajes
1. Envía varios mensajes
2. Recarga la página (F5)
3. **Verificar**:
   - ✅ Los mensajes se mantienen después de recargar
   - ✅ El historial se carga correctamente

#### Prueba 3: Subida de Archivo (Imagen)
1. Adjunta una imagen (JPG, PNG, WebP)
2. Opcionalmente escribe un mensaje con la imagen
3. Envía
4. **Verificar**:
   - ✅ El archivo se sube correctamente
   - ✅ Se guarda en `medical_files` con `reliability_score = null`
   - ✅ Aparece el mensaje del bot sobre el archivo
   - ✅ El bot genera respuesta JSON con `reliability_score` (genérico por ahora)

#### Prueba 4: Paginación (Scroll Infinito)
1. Envía más de 21 mensajes
2. Haz scroll hacia arriba
3. **Verificar**:
   - ✅ Se cargan más mensajes automáticamente
   - ✅ El scroll funciona correctamente

#### Prueba 5: Tiempo Real
1. Abre el chat en dos pestañas diferentes
2. Envía un mensaje en una pestaña
3. **Verificar**:
   - ✅ El mensaje aparece automáticamente en la otra pestaña
   - ✅ No hay duplicados

---

## 🔍 Verificación en Base de Datos

### Verificar Conversación Creada

```sql
SELECT * FROM conversations 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Verificar Mensajes Guardados

```sql
SELECT * FROM chat_messages 
WHERE conversation_id IN (
  SELECT id FROM conversations WHERE user_id = auth.uid()
)
ORDER BY sent_at DESC;
```

### Verificar Archivos con Reliability Score

```sql
SELECT id, file_name, reliability_score, created_at 
FROM medical_files 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

---

## ⚠️ Problemas Comunes y Soluciones

### Error: "relation 'conversations' does not exist"
**Solución**: Aplica las migraciones a tu base de datos de Supabase.

### Error: "permission denied for table conversations"
**Solución**: Verifica que las políticas RLS estén correctamente configuradas en Supabase.

### Los mensajes no se guardan
**Solución**: 
- Verifica que el usuario esté autenticado
- Verifica que exista un `activePatient`
- Revisa la consola del navegador para errores

### El mensaje de bienvenida aparece dos veces
**Solución**: Esto puede pasar si se crea la conversación dos veces. Verifica que `useConversation` solo se ejecute una vez.

### Los mensajes no aparecen en tiempo real
**Solución**: 
- Verifica que las suscripciones de Supabase estén habilitadas
- Revisa la consola para errores de conexión
- Verifica que el `conversationId` sea válido

---

## 📊 Checklist de Verificación

- [ ] Migraciones aplicadas a Supabase
- [ ] Usuario autenticado
- [ ] Paciente activo seleccionado
- [ ] Primer mensaje crea conversación automáticamente
- [ ] Mensaje de bienvenida aparece
- [ ] Mensajes se guardan en base de datos
- [ ] Mensajes se cargan al recargar página
- [ ] Archivos se suben correctamente
- [ ] `reliability_score` se actualiza desde JSON del bot
- [ ] Paginación funciona (scroll infinito)
- [ ] Tiempo real funciona (suscripciones)

---

## 🐛 Debug

### Habilitar Logs de Supabase

En `src/integrations/supabase/client.ts`, puedes agregar logs:

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  // Agregar para debug
  // db: { schema: 'public' },
  // global: { headers: { 'x-my-custom-header': 'mama-chat' } },
});
```

### Verificar en Consola del Navegador

Abre las DevTools (F12) y revisa:
- **Console**: Errores de JavaScript
- **Network**: Llamadas a Supabase
- **Application > Local Storage**: Sesión de Supabase

---

## ✅ Listo para Probar

Todo el código está implementado y compilando correctamente. Solo falta:
1. Aplicar las migraciones a tu base de datos de Supabase
2. Probar la funcionalidad en el navegador

¡El chat con persistencia está listo! 🎉


