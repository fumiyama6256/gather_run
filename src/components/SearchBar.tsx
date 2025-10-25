import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import * as Location from 'expo-location';

type SearchBarProps = {
  onLocationSelect: (latitude: number, longitude: number) => void;
};

export default function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    Keyboard.dismiss();

    try {
      // ジオコーディング: 住所や場所名から座標を取得
      const results = await Location.geocodeAsync(searchQuery);

      if (results.length === 0) {
        setError('場所が見つかりませんでした');
        setIsSearching(false);
        return;
      }

      // 最初の結果を使用
      const { latitude, longitude } = results[0];
      onLocationSelect(latitude, longitude);
      setSearchQuery('');
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="場所を検索（住所、ランドマーク等）"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          editable={!isSearching}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.searchIcon}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
  },
});
