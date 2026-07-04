import React, { useEffect, useState } from 'react';
import { Image, ImageProps } from 'react-native';
import { AuthStorage } from '../api/authStorage';
import { resolveImageUri } from '../utils/imageUtils';

interface AuthImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
}

const AuthImage = ({ uri, style, ...props }: AuthImageProps) => {
  const [source, setSource] = useState<{ uri: string; headers?: Record<string, string> }>({ uri: '' });

  useEffect(() => {
    const resolved = resolveImageUri(uri);
    if (!resolved) {
      setSource({ uri: '' });
      return;
    }
    AuthStorage.getToken().then(token => {
      if (token && resolved.startsWith('http')) {
        setSource({ uri: resolved, headers: { Authorization: `Bearer ${token}` } });
      } else {
        setSource({ uri: resolved });
      }
    });
  }, [uri]);

  if (!source.uri) return null;

  return <Image source={source} style={style} {...props} />;
};

export default AuthImage;
