import React, { useEffect, useState } from 'react';
import { Image, ImageProps } from 'react-native';
import { AuthStorage } from '../api/authStorage';
import { APIURL } from '../environment/ApiConfig';

interface AuthImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
}

const AuthImage = ({ uri, style, ...props }: AuthImageProps) => {
  const [source, setSource] = useState<{ uri: string; headers?: Record<string, string> }>({ uri });

  useEffect(() => {
    if (uri && (uri.startsWith(APIURL) || uri.startsWith('http'))) {
      AuthStorage.getToken().then(token => {
        if (token) {
          setSource({ uri, headers: { Authorization: `Bearer ${token}` } });
        } else {
          setSource({ uri });
        }
      });
    } else {
      setSource({ uri });
    }
  }, [uri]);

  return <Image source={source} style={style} {...props} />;
};

export default AuthImage;
