# 🔧 ARREGLAR MONGODB ATLAS

## 🚨 Problema Identificado:

```
MongoServerError: user is not allowed to do action [find] on [spelplaut.canchas]
```

## 📋 Pasos para Solucionar:

### **1. VERIFICAR PERMISOS EN MONGODB ATLAS:**

1. **Ir a MongoDB Atlas** → https://cloud.mongodb.com
2. **Database Access** (lado izquierdo)
3. **Encontrar tu usuario** → Click en **"Edit"**
4. **Verificar permisos:**
   - ✅ **Built-in Role**: `Atlas admin` o `readWriteAnyDatabase`
   - ✅ **Database**: `spelplaut` o `admin`

### **2. ACTUALIZAR .env.local:**

```bash
# Editar el archivo .env.local con la configuración correcta:
nano .env.local
```

```env
# MongoDB Atlas - Conexión correcta
MONGODB_URI=mongodb+srv://TU_USUARIO:TU_PASSWORD@TU_CLUSTER.mongodb.net/spelplaut?retryWrites=true&w=majority

# Reemplazar:
# TU_USUARIO = usuario real de MongoDB Atlas
# TU_PASSWORD = contraseña real (sin caracteres especiales)
# TU_CLUSTER = nombre de tu cluster
```

### **3. VERIFICAR WHITELIST IP:**

1. **Network Access** en MongoDB Atlas
2. **Add IP Address** → `0.0.0.0/0` (para desarrollo)
3. **Confirm**

### **4. CREAR USUARIO CON PERMISOS COMPLETOS:**

```javascript
// En MongoDB Atlas → Database Access → Add New Database User
{
  "username": "admin",
  "password": "admin123",
  "roles": [
    {
      "role": "readWriteAnyDatabase",
      "db": "admin"
    }
  ]
}
```

### **5. STRING DE CONEXIÓN CORRECTO:**

```env
MONGODB_URI=mongodb+srv://admin:admin123@cluster0.abcdef.mongodb.net/spelplaut?retryWrites=true&w=majority&appName=Cluster0
```

### **6. REINICIAR SERVIDOR:**

```bash
pnpm dev
```

## ✅ **SOLUCIÓN RÁPIDA:**

Si tienes acceso a MongoDB Atlas, ejecuta estos comandos:

```bash
# 1. Parar servidor
pkill -f "next dev"

# 2. Crear usuario con permisos en Atlas (via web)

# 3. Actualizar .env.local con nuevo string

# 4. Reiniciar
pnpm dev
```

## 🔍 **VERIFICAR CONEXIÓN:**

```bash
curl http://localhost:3001/api/canchas
```

**Resultado esperado:** JSON con lista de canchas (puede estar vacía)
