import { useTranslation } from 'react-i18next'
import { changeLanguage } from '../../i18n'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, isLanguage } from '../../lib/language'
import { ChoiceCards } from '../ChoiceCards/ChoiceCards'

export function LanguagePicker() {
  const { t, i18n } = useTranslation()
  const current = isLanguage(i18n.language) ? i18n.language : 'fr'

  return (
    <ChoiceCards
      label={t('settings.language.title')}
      value={current}
      onChange={changeLanguage}
      choices={SUPPORTED_LANGUAGES.map((language) => ({
        value: language,
        label: LANGUAGE_NAMES[language],
        lang: language,
      }))}
    />
  )
}
