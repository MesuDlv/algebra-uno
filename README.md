# ALGEBRA UNO 🎴📐

Juego de cartas multijugador online, mobile-first, inspirado en el clásico UNO, donde las cartas son expresiones algebraicas en lugar de números.

Desarrollado con **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **KaTeX** y **Firebase** (plan Spark gratuito).

---

## 🎨 Las Cartas y Variables

| Color | Variable | Significado de la letra |
|---|---|---|
| 🟢 **Verde** | **Y** | Variable fija del color verde |
| 🔴 **Rojo** | **Z** | Variable fija del color rojo |
| 🔵 **Azul** | **F** | Variable fija del color azul |
| 🟡 **Amarillo** | **N** | Variable fija del color amarillo |
| 🌈 **Comodín** | **x** | Variable general para comodines |

### Tipos de Cartas (Mazo de 108 cartas)
1. **Numéricas (0 a 9)**: Ecuaciones algebraicas cuya solución única entera es el número de la carta (ej. $2 + Y = 4 \implies 2$, $4Z = 8 \implies 2$). Coinciden por **color** o por **solución matemática**.
2. **Bloqueo**: Indeterminación con división por cero en la variable del color (ej. $\frac{Y+3}{0}$).
3. **Cambio de Sentido**: Desigualdad multiplicada por $-1$ donde el signo se invierte (ej. $(Y - 1 > 2) \cdot (-1) \implies -Y + 1 < -2$). *(Con 2 jugadores funciona como bloqueo)*.
4. **+2 (Roba dos)**: Expresión espejo donde las variables se cancelan y simplifica exactamente a $2$ (ej. $(Z+3) + (Z-1) - 2Z = 2$).
5. **+4 Comodín**: Expresión espejo en variable $x$ que simplifica a $4$. Permite elegir color y habilita la regla oficial de **Desafiar / Aceptar**.
6. **Comodín de Color**: "Sea $x$ cualquier variable" $\{Y, Z, F, N\}$. Permite elegir color.

---

## 🏗️ Arquitectura Sin Servidor (Firebase Spark)

El juego utiliza una arquitectura de **Event Sourcing determinista**:
- **Cero costo de servidor**: No requiere Cloud Functions ni plan Blaze de Firebase.
- **Registro Append-Only**: Los eventos del juego se guardan secuencialmente en `rooms/{roomId}/events/{seq}`.
- **Motor determinista puro**: Cada cliente ejecuta `reduce(estado, evento)` y llega exactamente al mismo estado en memoria.
- **PRNG semillado**: El mazo se baraja de manera idéntica en todos los clientes usando el generador **Mulberry32** con la semilla inicial de la sala.

> ⚠️ **Nota de Transparencia sobre Privacidad**:  
> Al no existir un árbitro central con funciones backend, todos los clientes reciben la semilla para calcular los turnos y jugadas legales. La privacidad de las manos se garantiza **a nivel de interfaz visual** (el cliente solo dibuja en pantalla las cartas del jugador local). Un usuario con conocimientos técnicos avanzados podría inspeccionar la consola del navegador y deducir las cartas restantes. Este diseño está concebido para jugar de manera recreativa y amigable.

---

## 🚀 Instalación y Desarrollo Local

### 1. Instalar dependencias
```powershell
npm install
```

### 2. Configurar variables de entorno
Copia el archivo `.env.example` como `.env.local`:
```powershell
Copy-Item .env.example .env.local
```
Abre `.env.local` y pega las claves de tu proyecto Firebase (ver instrucciones abajo).

### 3. Iniciar servidor de desarrollo
```powershell
npm run dev
```

### 4. Ejecutar pruebas unitarias
```powershell
npm run test
```

---

## 🔒 Despliegue de Reglas de Firebase

Para publicar las reglas de seguridad de Firestore en tu proyecto de Firebase:
```powershell
npx firebase deploy --only firestore:rules
```

---

## 🌐 Despliegue en GitHub Pages

El proyecto cuenta con un flujo automatizado en `.github/workflows/deploy.yml`:
1. Cada `git push` a la rama `main` compila la aplicación y la publica en GitHub Pages.
2. **Importante**: En tu proyecto de Firebase Console:
   - Ve a **Authentication** $\rightarrow$ **Settings** $\rightarrow$ **Authorized domains**.
   - Agrega tu dominio: `MesuDlv.github.io`.
   - Si no agregas este dominio, el inicio de sesión anónimo fallará en la web publicada.
