import React from 'react';
import { View, Text } from 'react-native';
import styles from './EmptyState.styles';
import AppIcon from '../../AppIcon';
import AppButton from '../AppButton';
import colors from '../../../theme/colors';

export const EmptyState = ({
  icon = 'cube-outline',
  iconColor = colors.slate400,
  iconSize = 36,
  title = 'No Items Found',
  description = 'There are no items to display right now.',
  actionTitle,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <AppIcon name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionTitle && onActionPress ? (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="medium"
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
};

export default EmptyState;

