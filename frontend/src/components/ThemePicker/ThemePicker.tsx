import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import { ChoiceCards } from '../ChoiceCards/ChoiceCards'

export function ThemePicker() {
  const { t } = useTranslation()
  const { preference, setPreference } = useTheme()

  return (
    <ChoiceCards
      label={t('theme.label')}
      value={preference}
      onChange={setPreference}
      choices={[
        { value: 'light', label: t('theme.light'), icon: Sun },
        { value: 'dark', label: t('theme.dark'), icon: Moon },
        { value: 'system', label: t('theme.system'), icon: Monitor },
      ]}
    />
  )
}
