import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import styles from './SearchBar.styles';
import { Colors } from '../constants/colors';
import AppIcon from './AppIcon';

export const SearchBar = ({
  value,
  onChangeText,
  onSubmit,
  onPress,
  placeholder = 'Search 1,00,000+ products across India...',
  editable = true,
  showFilter = false,
  onFilterPress,
  style,
}) => {
  if (!editable && onPress) {
    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={styles.searchBox}>
          <AppIcon
            name="search"
            size={20}
            color={Colors.primary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            editable={false}
            pointerEvents="none"
            style={styles.input}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchBox}>
        <AppIcon
          name="search"
          size={20}
          color={Colors.primary}
          style={styles.searchIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
        />
        {value ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChangeText?.('')}
            activeOpacity={0.7}>
            <AppIcon name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        {showFilter && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={onFilterPress}
            activeOpacity={0.7}>
            <AppIcon name="filter-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SearchBar;

