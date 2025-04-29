// import axios from 'axios';

// // import { useMutation } from "@tanstack/react-query";
// import { APIURL } from "../environment/ApiConfig";





//   const useLogin = async (email: string, password: string) => {
//     const registerUserData = await axios.post(`${APIURL}/auth/login`, {
//       email,
//       password,
//     });
//     console.log('Register User Data:', registerUserData.data);
    
//      return registerUserData.data;
//   }
// export default useLogin;








import axios from 'axios';
import { APIURL } from "../environment/ApiConfig";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    // other user fields
  };
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${APIURL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error; // Re-throw for mutation to handle
  }
}









// export const useLogin = () => {
//   const loginUser = useMutation({
//     mutationFn: (body: any) => {
//       const myHeaders = new Headers();
//       myHeaders.append('Content-Type', 'application/json');

//       const raw = JSON.stringify(body);
//       console.log('Sending login request with body:', body); 

//       const requestOptions: RequestInit = {
//         method: 'POST',
//         headers: myHeaders,
//         body: raw,
//         redirect: 'follow',
//       };

//       return fetch(`${APIURL}/auth/login`, requestOptions).then(response => {
//         console.log('Response status:', response.status); // Log the response status
        
//         return response.json();
//       });
//     },
//   });
//   return { loginUser };
// };