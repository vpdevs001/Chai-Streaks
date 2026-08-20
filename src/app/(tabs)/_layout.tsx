import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import TabIcon from '../../components/navigation/TabIcon';

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 6);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        },
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Tasks" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⏱️" label="Timer" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Progress" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}
