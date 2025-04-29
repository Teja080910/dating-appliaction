// import { useMutation } from '@tanstack/react-query';
// import  useLogin from "./useLogin"
// // import EncryptedStorage from 'react-native-encrypted-storage';
// import { useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// // import { AsyncStorage } from 'react-native';

// // import Toast from "react-native-toast-message";
// // import { AsyncStorageService } from "../utils/types/genderStorage";
// // import { messaging} from '../utils/firebaseConfig'
// // import RNRestart from 'react-native-restart';
// // import { useLogin } from "./useRegister";

// import { RootParamList } from '../utils/types/navigation.types';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { AsyncStorageService } from '../utils/types/genderStorage';


// const loginSubmit = () => {
//   const { loginUser } = useLogin()

//   type RegisterScreenNavigationProp = StackNavigationProp<RootParamList, 'Register'>;

// const navigation = useNavigation<RegisterScreenNavigationProp>();


//   const mutation = useMutation({
//     mutationFn: ({email, password}: {email: string, password: string}) => 
//       loginUser(email, password),

//     onSuccess: async (data) => {
//       await AsyncStorage.setItem('islog', 'true');
//       // await EncryptedStorage.setItem('auth_token', JSON.stringify(data.user));
//       AsyncStorageService.setUser(data);
//       navigation.replace('Privacy')
//     },
//     onError: (error) => {
//       console.error('Error on logging user:', error);
//     }
//   })
//   return mutation

// }

// export default loginSubmit;









import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../api/useLogin';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootParamList } from '../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';
import { AsyncStorageService } from '../utils/types/AsyncStorage';
import { Alert } from 'react-native';

type LoginCredentials = {
  // email: string;
  username: string;
  password: string;
};

export const useLoginMutation = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  return useMutation({
    mutationFn: ({ username, password }: LoginCredentials) => 
      loginUser(username, password),

    onSuccess: async (data) => {
      await Promise.all([
        AsyncStorage.setItem('isLoggedIn', 'true'),
        AsyncStorageService.setUser(data)
      ]);
      navigation.replace('Privacy');
    },
    onError: (error) => {
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password'
      );
    }
  });
}










// export const loginSubmit = async (values: {
//   phoneNumber: string;
//   password: string;
// }) => {
//   const { loginUser } = useLogin()
//   const token = await messaging().getToken();

//   if (token) {
//     loginUser.mutate(
//       {
//         username: values.phoneNumber,
//         password: values.password,
//         fcmToken: `${token}`,
//       },
//       {
//         onSuccess: (data: any) => {
//           if (data.message == "Please check password") {
//             Toast.show({
//               type: 'error',
//               text1: data.message,
//             });
//           } else if (data.message == "Account not found") {
//             Toast.show({
//               type: 'error',
//               text1: data.message,
//             });
//           } else {
//             AsyncStorageService.setUser(data);
//             // Toast.show({
//             //   type: 'success',
//             //   text1: 'Login successfull',
//             // });
            
//             setTimeout(() => {
//               RNRestart.restart();
//             }, 1000);
//           }

//         },
//         onError: (error: any) => {
//           console.log(error, "===data")

//           // Handle error here
//           Toast.show({
//             type: 'error',
//             text1: 'Please Check Your PhoneNumber And Password !!',
//             // text2: error.message, // Display the error message received from the backend
//           });
//         },
//       },
//     );
//   }
// };





// export const useLoginSubmit = () => {
//   const { loginUser } = useLogin();

//   const loginSubmit = async (values: {
//     phoneNumber: string;
//     password: string;
//   }) => {
//     try {
//       // Get FCM token
//       const token = await messaging.getToken();
//       console.log('FCM Token:', token);
      
//       if (!token) {
//         throw new Error("Failed to get device token");
//       }

//       return new Promise((resolve, reject) => {
//         loginUser.mutate(
//           {
//             username: values.phoneNumber,
//             password: values.password,
//             fcmToken: token,
//           },
//           {
//             onSuccess: (data) => {
//               console.log('Login response:', data);
              
//               if (data?.error || data?.message?.includes('check password') || data?.message?.includes('not found')) {
//                 Toast.show({
//                   type: 'error',
//                   text1: data.message || 'Invalid credentials',
//                 });
//                 reject(data);
//               } else {
//                 AsyncStorageService.setUser(data);
//                 resolve(data);
//               }
//             },
//             onError: (error) => {
//               console.error('Login error:', error);
//               Toast.show({
//                 type: 'error',
//                 text1: 'Login failed. Please try again.',
//               });
//               reject(error);
//             },
//           }
//         );
//       });
//     } catch (error) {
//       console.error('Login process error:', error);
//       Toast.show({
//         type: 'error',
//         text1: 'Login process failed. Please try again.',
//       });
//       throw error;
//     }
//   };

//   return { loginSubmit };
// };