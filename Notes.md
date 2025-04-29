#  What’s happening when they say “send variable name”?

When the backend team says something like:
“Send the variable name” or “Send this field,”
they are basically saying:

“Hey, tell us what key (or field name) you're sending from the frontend when you make an API request.”

Example:
Imagine you're creating a signup screen. You have:

```sh
const name = "Rahul";
const age = 23;
const gender = "male";

```

The backend needs to know:

```sh
{
  "name": "Rahul",
  "age": 23,
  "gender": "male"
}
```


So, they’re asking:

Are you sending **userName** or **name** ?

Are you sending **dob** or **dateOfBirth** ?

## ✅ Here's What Happens ?

🛠️ Backend Creates an API

Example: https://api.glambu.com/api/register

This is a link to a service (like a waiter in a restaurant).

**They also tell you:**

What data they want (fields like name, email, dob, etc.)

What format they want it in (e.g. JSON)

What they'll return if it's successful or if there's an error.

🧑‍🎨 You (Frontend) Build the Form

Input fields like:

**Name**

**Email**

**Password**

**Date of Birth**

You collect these values using React Native useState.

# 🎯 First: Should you always use axios or fetch?

✅ Yes, always use either axios or fetch (or other HTTP clients) to:

- Send data from frontend 👉 backend

- Get data from backend 👉 frontend


# 🎬 Scene: How Data Flow Works (Frontend ↔ Backend)

Let’s say you have a Register page.

**1️⃣ User enters email & password:**

```sh
const [email, setEmail] = useState("a@g.com");
const [password, setPassword] = useState("123456");
```

**2️⃣ You send this to backend via Axios or Fetch**
```sh
await axios.post('https://api.glambu.com/api/register', {
  email,
  password,
});
```
**3️⃣ Backend receives it 👨‍💻**
```sh
// backend checks if user already exists
// then saves it in database (like MongoDB, MySQL, etc.)
```
**4️⃣ Backend sends response back to you (frontend)**

```sh
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "id": "abc123",
    "email": "a@g.com"
  }
}
```
# ✅ Where to store this data on frontend?
**If the backend sends token + user info, then:**

📦 Store token in AsyncStorage (secure local storage)

📦 Store minimal user info if needed


```sh
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('token', token);
await AsyncStorage.setItem('user', JSON.stringify(user));
```

# 🔁 How to Fetch Data from Backend Later?

**Example: Profile screen**

```sh
const token = await AsyncStorage.getItem('token');

const response = await axios.get('https://api.glambu.com/api/profile', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

console.log(response.data); // profile info
```

# 🧠 When to use React TanStack Query (React Query)?
⚡ Use it for data fetching + caching + auto-refresh + sync with server.

**🔥 Why it’s awesome:
Automatically caches API responses**

- Handles loading / error / success states easily

- Auto-refetches and syncs with server

- Built-in retry, stale time, pagination, and much more

# 🔐 Is AsyncStorage Safe?
**🟡 Quick Answer: It's safe-ish but not secure enough for sensitive data like passwords, access tokens, etc.**

- YES for storing tokens/user info temporarily

- NO for storing sensitive info unencrypted (like passwords or bank info)

# 🛡️ How to Make AsyncStorage Safe?
**👉 Use encryption wrappers with AsyncStorage!**

🔐 1. react-native-encrypted-storage

```sh
npm install react-native-encrypted-storage 
```

**✅ Usage:**
```sh
import EncryptedStorage from 'react-native-encrypted-storage';

await EncryptedStorage.setItem('user_token', token);
const token = await EncryptedStorage.getItem('user_token');
await EncryptedStorage.removeItem('user_token');

```

# 🧠 Bonus: If You Use React Query with AsyncStorage
**Use onSuccess to store token after login:**

```sh
const mutation = useMutation(loginUser, {
  onSuccess: async (data) => {
    await EncryptedStorage.setItem('token', data.token);
  },
});
```

# 🧼 What happens when app is killed?
When app is killed from background or restarted, the TanStack cache is wiped, unless you have persisted it manually (see below ⬇️).

# ✅ Want to Persist It? Use This Setup:
You can keep TanStack cache even after kill or restart using this method:

# 🔄 persistQueryClient
This is a special utility provided by TanStack Query (also known as React Query) to persist and rehydrate the cache, even after the app restarts.

# 📦 What does persistQueryClient do?
By default, TanStack Query stores all cached data in memory (RAM). So if your app is:

- Closed or killed from background 🔚

- Device restarted 🔁

…you lose that cache 😢

**To solve this, persistQueryClient helps you: ✅ Save the query cache to storage (like AsyncStorage or EncryptedStorage)**

**✅ Restore it when the app opens again**