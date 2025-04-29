import { useState } from "react";
import AppContext from "./CreateGlobalStateContext";

const GlobalStateProvider =  ({children}: any) => {

  const [initialScreen, setInitialScreen] = useState<string | null>(null);
  const [date, setDate] = useState(new Date(1995, 3, 11)); 
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [images, setImages] = useState<(string | null)[]>([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [login, setLogin] = useState(false);
    const [oppositeGender, setOppositeGender] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [username, setUsername] = useState('');
    const [selectedAppearance, setSelectedAppearance] = useState<string | null>(null);
    const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
    const [height, setHeight] = useState(165);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [tempHeight, setTempHeight] = useState(height);4
    const [englishSkillLevel, setEnglishSkillLevel] = useState(0);
   const [selectedEthinicity, setSelectedEthinicity] = useState<string | null>('');
   const [selectedSmoking, setSelectedSmoking] = useState<string | null>('');
   const [selectedKidCount, setSelectedKidCount] = useState<string | null>('');
   const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);

  return (
    <AppContext.Provider value={{
      initialScreen,
      setInitialScreen,
      date,
      setDate,
      selected,
      setSelected,
      name,
      setName,
      email,
      setEmail,
      password, 
      setPassword,
      images,
      setImages,
      isModalVisible,
      setIsModalVisible,
      selectedIndex,
      setSelectedIndex,
      login,
      setLogin,
      oppositeGender,
      setOppositeGender,
      phoneNumber,
      setPhoneNumber,
      username,
      setUsername,
      selectedAppearance,
      setSelectedAppearance,
      selectedBodyType,
      setSelectedBodyType,  
      height,
      setHeight,
      selectedLanguages,
      setSelectedLanguages,
      tempHeight,
      setTempHeight,
      englishSkillLevel,
      setEnglishSkillLevel,
      selectedEthinicity,
      setSelectedEthinicity,
      selectedSmoking,
      setSelectedSmoking,
      selectedKidCount,
      setSelectedKidCount,
      selectedLookingFor,
      setSelectedLookingFor,
     
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default GlobalStateProvider;