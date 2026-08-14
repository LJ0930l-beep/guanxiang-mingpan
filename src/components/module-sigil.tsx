import { StyleSheet, Text, View } from 'react-native';

import { fontFamilies, palette } from '@/constants/guanxiang';
import type { DivinationModule } from '@/types/domain';

interface ModuleSigilProps {
  module: DivinationModule;
  size?: number;
  accent?: string;
}

const palaceCells = [0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15];

export function ModuleSigil({ module, size = 112, accent = palette.brass }: ModuleSigilProps) {
  const unit = size / 4;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { width: size, height: size, borderRadius: size / 2, borderColor: accent }]}>
      {module === 'bazi' && (
        <View style={styles.pillars}>
          {['年', '月', '日', '时'].map((label, index) => (
            <View key={label} style={[styles.pillar, { borderColor: accent, transform: [{ translateY: index % 2 ? 5 : -3 }] }]}>
              <Text style={[styles.pillarTop, { color: accent }]}>{label}</Text>
              <View style={[styles.pillarLine, { backgroundColor: accent }]} />
              <View style={[styles.pillarLineShort, { backgroundColor: accent }]} />
            </View>
          ))}
        </View>
      )}
      {module === 'liuyao' && (
        <View style={styles.yaoStack}>
          {[false, true, false, false, true, true].map((broken, index) => (
            <View key={index} style={styles.yaoRow}>
              {broken ? (
                <>
                  <View style={[styles.yaoHalf, { backgroundColor: accent }]} />
                  <View style={[styles.yaoHalf, { backgroundColor: accent }]} />
                </>
              ) : <View style={[styles.yaoFull, { backgroundColor: accent }]} />}
            </View>
          ))}
        </View>
      )}
      {module === 'ziwei' && (
        <View style={[styles.palaceGrid, { width: unit * 3.1, height: unit * 3.1 }]}>
          {palaceCells.map((cell) => (
            <View
              key={cell}
              style={[
                styles.palaceCell,
                {
                  width: unit * 0.74,
                  height: unit * 0.74,
                  left: (cell % 4) * unit * 0.78,
                  top: Math.floor(cell / 4) * unit * 0.78,
                  borderColor: accent,
                },
              ]}
            />
          ))}
          <Text style={[styles.ziweiCenter, { color: accent }]}>紫微</Text>
        </View>
      )}
      {module === 'astrology' && (
        <View style={[styles.orbitOuter, { width: size * 0.7, height: size * 0.7, borderRadius: size, borderColor: accent }]}>
          <View style={[styles.orbitInner, { borderColor: accent }]} />
          {[15, 88, 164, 236, 305].map((degree) => (
            <View key={degree} style={[styles.planetRay, { transform: [{ rotate: `${degree}deg` }, { translateY: -size * 0.31 }] }]}>
              <View style={[styles.planet, { backgroundColor: accent }]} />
            </View>
          ))}
          <View style={[styles.aspect, { backgroundColor: accent, transform: [{ rotate: '32deg' }] }]} />
          <View style={[styles.aspect, { backgroundColor: accent, transform: [{ rotate: '143deg' }] }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'rgba(5, 9, 7, 0.56)', overflow: 'hidden' },
  pillars: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillar: { width: 18, height: 62, alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 6 },
  pillarTop: { fontFamily: fontFamilies.display, fontSize: 12 },
  pillarLine: { width: 12, height: 1, marginTop: 12, opacity: 0.68 },
  pillarLineShort: { width: 8, height: 1, marginTop: 10, opacity: 0.45 },
  yaoStack: { width: '56%', gap: 6 },
  yaoRow: { height: 4, flexDirection: 'row', justifyContent: 'space-between' },
  yaoFull: { width: '100%', height: 3, borderRadius: 2 },
  yaoHalf: { width: '43%', height: 3, borderRadius: 2 },
  palaceGrid: { position: 'relative' },
  palaceCell: { position: 'absolute', borderWidth: 0.7, opacity: 0.65 },
  ziweiCenter: { position: 'absolute', left: '35%', top: '41%', fontFamily: fontFamilies.display, fontSize: 11, letterSpacing: 2 },
  orbitOuter: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  orbitInner: { width: '48%', height: '48%', borderWidth: 1, borderRadius: 999, opacity: 0.55 },
  planetRay: { position: 'absolute', width: 8, height: 8, alignItems: 'center' },
  planet: { width: 5, height: 5, borderRadius: 3 },
  aspect: { position: 'absolute', width: '60%', height: 1, opacity: 0.4 },
});

