import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { UI_STATE_COPY, type UiState } from '@/constants/ui-copy';

interface StatePanelProps {
  state: UiState;
  onAction?: () => void;
  actionLabel?: string;
  title?: string;
  body?: string;
  testID?: string;
  compact?: boolean;
}

/**
 * Shared state surface for routes and module workspaces.
 *
 * Keeping the announcement, visible copy and recovery action together makes
 * partial/blocked/unknown states explicit on both Web and native surfaces.
 * The component never derives a result or silently retries an operation.
 */
export function StatePanel({
  state,
  onAction,
  actionLabel,
  title,
  body,
  testID,
  compact = false,
}: StatePanelProps) {
  const copy = UI_STATE_COPY[state];
  const isAlert = state === 'failure' || state === 'blocked';
  const resolvedTitle = title ?? copy.title;
  const resolvedBody = body ?? copy.body;

  return (
    <View
      accessibilityLabel={`${copy.announcement} ${resolvedBody}`}
      accessibilityLiveRegion={isAlert ? 'assertive' : 'polite'}
      accessibilityRole={isAlert ? 'alert' : 'text'}
      style={[styles.panel, compact && styles.panelCompact, isAlert && styles.panelAlert]}
      testID={testID}>
      <Text accessibilityRole="header" style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.body}>{resolvedBody}</Text>
      {onAction && (
        <ActionButton
          accessibilityHint={copy.announcement}
          accessibilityLabel={actionLabel ?? copy.action}
          onPress={onAction}
          style={styles.action}
          variant={isAlert ? 'secondary' : 'quiet'}>
          {actionLabel ?? copy.action}
        </ActionButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.x6,
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.card,
    backgroundColor: 'rgba(8, 26, 22, 0.78)',
    padding: spacing.x5,
  },
  panelCompact: { padding: spacing.x4 },
  panelAlert: {
    borderColor: 'rgba(216, 137, 120, 0.48)',
    backgroundColor: 'rgba(120, 48, 36, 0.14)',
  },
  title: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 17 },
  body: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20 },
  action: { marginTop: spacing.x4, alignSelf: 'flex-start', minHeight: layout.minTouch },
});
