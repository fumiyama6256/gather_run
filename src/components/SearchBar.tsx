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

type SearchBarProps = {
  onLocationSelect: (latitude: number, longitude: number) => void;
};

export default function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    Keyboard.dismiss();

    try {
      // Google Places Autocomplete API
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        searchQuery
      )}&key=${GOOGLE_PLACES_API_KEY}&language=ja&components=country:jp`;

      const response = await fetch(autocompleteUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        // 最初の候補を自動選択
        const firstResult = data.predictions[0];
        await getPlaceDetails(firstResult.place_id);
      } else {
        setError('場所が見つかりませんでした');
        setIsSearching(false);
      }
    } catch (err) {
      console.error('Google Places API error:', err);
      setError('検索に失敗しました');
      setIsSearching(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      // Place Details API
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&language=ja&fields=geometry`;

      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        onLocationSelect(lat, lng);
        setSearchQuery('');
        setError('');
      } else {
        setError('場所の詳細取得に失敗しました');
      }
    } catch (err) {
      console.error('Place details error:', err);
      setError('場所の詳細取得に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="場所を検索（清美山競技場など）"
          placeholderTextColor="#999"
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
            <ActivityIndicator size="small" color="#52C41A" />
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
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7EB8F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#FFF1F0',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
});
