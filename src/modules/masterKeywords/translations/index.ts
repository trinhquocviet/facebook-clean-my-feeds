import type { Language } from './types';
import en from './en';
import ar from './ar';
import bg from './bg';
import cs from './cs';
import de from './de';
import el from './el';
import es from './es';
import fi from './fi';
import fr from './fr';
import he from './he';
import id from './id';
import it from './it';
import ja from './ja';
import lv from './lv';
import nl from './nl';
import pl from './pl';
import pt from './pt';
import ru from './ru';
import tr from './tr';
import uk from './uk';
import vi from './vi';
import zhHans from './zhHans';
import zhHant from './zhHant';


const translations: {
  [key: string]: Language,
} = {
  // - NF_ = News Feed
  // - GF_ = Groups Feed
  // - VF_ = Videos Feed
  // - MP_ = Marketplace Feed
  // - PP_ = Person/Page Profile
  // - DLG_ = CMF's Dialog box
  // - CMF_ = CMF's Dialog box
  // - GM_ = Userscript manager

  en, // -- English
  ar, // -- العربية (Arabic)
  bg, // -- България (Bulgaria)
  cs, // -- Čeština (Czechia)
  de, // -- Deutsch (Germany)
  el, // -- Ελληνικά (Greece)
  es, // -- Espanol (Spain)
  fi, // -- Suomi - Finnish (Finland)
  fr, // -- Français (France)
  he, // -- עִברִית (Hebrew)
  id, // -- Bahasa Indonesia (Indonesia)
  it, // -- Italino (Italy)
  ja, // -- Japanese (Japan)
  lv, // -- Latviešu (Latvia)
  nl, // -- Nederlands (Netherlands)
  pl, // -- Polski (Poland)
  pt, // -- Português (Portugal and Brazil)
  ru, // -- Русский (Russia)
  tr, // -- Türkçe (Turkey)
  uk, // -- Україна (Ukraine)
  vi, // -- Tiếng Việt (Vietnam)
  'zh-Hans': zhHans, // -- 简体中文 (Chinese (Simplified))
  'zh-Hant': zhHant, // -- 中國傳統的 (Chinese (Traditional))
}

export default translations;