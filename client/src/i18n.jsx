// Experiment 2: useContext for language (English, Hindi, Marathi)
import { createContext, useContext, useState, useEffect } from 'react';

const rows = [ // key, en, hi, mr
  ['home', 'Home', 'होम', 'मुख्यपृष्ठ'], ['prices', 'Mandi prices', 'मंडी भाव', 'मंडी भाव'],
  ['market', 'Sell and buy', 'बिक्री और खरीद', 'विक्री आणि खरेदी'], ['crops', 'Crop advice', 'फसल सलाह', 'पीक सल्ला'],
  ['info', 'Schemes and tips', 'योजनाएं और सुझाव', 'योजना आणि टिप्स'], ['dashboard', 'My listings', 'मेरी फसलें', 'माझी पिके'],
  ['login', 'Login', 'लॉगिन', 'लॉगिन'], ['register', 'Create account', 'खाता बनाएं', 'खाते तयार करा'],
  ['logout', 'Logout', 'लॉगआउट', 'लॉगआउट'],
  ['hero_h', 'Sell direct. Know your price.', 'सीधे बेचें, अपना भाव जानें।', 'थेट विका, तुमचा भाव जाणून घ्या.'],
  ['hero_p', "KisanSetu connects farmers with buyers, with today's mandi prices, weather and crop advice in your language.",
    'किसानसेतु किसानों को खरीदारों से जोड़ता है, साथ में आज के मंडी भाव, मौसम और फसल सलाह आपकी भाषा में।',
    'किसानसेतू शेतकऱ्यांना खरेदीदारांशी जोडतो, आजचे मंडी भाव, हवामान आणि पीक सल्ला तुमच्या भाषेत.'],
  ['board', "Today's mandi board", 'आज का मंडी भाव', 'आजचे मंडी भाव'],
  ['per_q', '₹ per quintal', '₹ प्रति क्विंटल', '₹ प्रति क्विंटल'],
  ['weather', 'Weather', 'मौसम', 'हवामान'], ['city', 'City', 'शहर', 'शहर'],
  ['humidity', 'Humidity', 'नमी', 'आर्द्रता'], ['wind', 'Wind', 'हवा', 'वारा'], ['rain', 'Rain', 'बारिश', 'पाऊस'],
  ['search', 'Search crop', 'फसल खोजें', 'पीक शोधा'], ['all_states', 'All states', 'सभी राज्य', 'सर्व राज्ये'],
  ['crop', 'Crop', 'फसल', 'पीक'], ['mandi', 'Mandi', 'मंडी', 'मंडी'], ['state', 'State', 'राज्य', 'राज्य'],
  ['modal', 'Common price', 'सामान्य भाव', 'सामान्य भाव'], ['range', 'Min to max', 'न्यूनतम से अधिकतम', 'किमान ते कमाल'],
  ['post', 'Post your crop', 'अपनी फसल डालें', 'तुमचे पीक टाका'], ['qty', 'Quantity (quintal)', 'मात्रा (क्विंटल)', 'प्रमाण (क्विंटल)'],
  ['price_q', 'Price per quintal', 'प्रति क्विंटल भाव', 'प्रति क्विंटल भाव'], ['location', 'Village or town', 'गाँव या शहर', 'गाव किंवा शहर'],
  ['enquire', 'Send enquiry', 'पूछताछ भेजें', 'चौकशी पाठवा'], ['message', 'Message', 'संदेश', 'संदेश'],
  ['delete', 'Delete', 'हटाएं', 'हटवा'], ['by', 'Farmer', 'किसान', 'शेतकरी'], ['enquiries', 'Enquiries', 'पूछताछ', 'चौकशी'],
  ['login_buyer', 'Login as a buyer to send an enquiry', 'पूछताछ भेजने के लिए खरीदार के रूप में लॉगिन करें', 'चौकशीसाठी खरेदीदार म्हणून लॉगिन करा'],
  ['soil', 'Soil', 'मिट्टी', 'माती'], ['season', 'Season', 'ऋतु', 'हंगाम'], ['water', 'Water available', 'पानी की उपलब्धता', 'पाणी उपलब्धता'],
  ['recommend', 'Recommend crops', 'फसल सुझाएं', 'पीक सुचवा'],
  ['black', 'Black', 'काली', 'काळी'], ['red', 'Red', 'लाल', 'लाल'], ['alluvial', 'Alluvial', 'जलोढ़', 'गाळाची'],
  ['sandy', 'Sandy', 'रेतीली', 'वालुकामय'], ['kharif', 'Kharif', 'खरीफ', 'खरीप'], ['rabi', 'Rabi', 'रबी', 'रब्बी'],
  ['zaid', 'Zaid', 'जायद', 'उन्हाळी'], ['low', 'Low', 'कम', 'कमी'], ['medium', 'Medium', 'मध्यम', 'मध्यम'], ['high', 'High', 'अधिक', 'जास्त'],
  ['schemes', 'Government schemes', 'सरकारी योजनाएं', 'सरकारी योजना'], ['tips', 'Farming tips', 'खेती के सुझाव', 'शेती टिप्स'],
  ['name', 'Your name', 'आपका नाम', 'तुमचे नाव'], ['email', 'Email', 'ईमेल', 'ईमेल'], ['password', 'Password (6+ characters)', 'पासवर्ड (6+ अक्षर)', 'पासवर्ड (6+ अक्षरे)'],
  ['role', 'I am a', 'मैं हूँ', 'मी आहे'], ['farmer', 'Farmer', 'किसान', 'शेतकरी'], ['buyer', 'Buyer', 'खरीदार', 'खरेदीदार'],
  ['loading', 'Loading…', 'लोड हो रहा है…', 'लोड होत आहे…'], ['none', 'Nothing here yet.', 'अभी कुछ नहीं।', 'अजून काही नाही.'],
  ['category', 'Category', 'श्रेणी', 'श्रेणी'], ['all', 'All', 'सभी', 'सर्व'], ['chat', 'Chat with farmer', 'किसान से चैट करें', 'शेतकऱ्याशी चॅट करा'],
  ['send', 'Send', 'भेजें', 'पाठवा'], ['edit', 'Edit', 'बदलें', 'बदला'], ['save', 'Save', 'सेव करें', 'जतन करा'],
  ['cancel', 'Cancel', 'रद्द करें', 'रद्द करा'], ['users', 'Users', 'उपयोगकर्ता', 'वापरकर्ते'], ['listings', 'Listings', 'सूची', 'यादी'],
  ['admin', 'Admin', 'एडमिन', 'प्रशासक'], ['chats', 'My chats', 'मेरी चैट', 'माझ्या चॅट'], ['description', 'Description', 'विवरण', 'वर्णन'],
  ['prev', 'Previous', 'पिछला', 'मागील'], ['next', 'Next', 'अगला', 'पुढील'], ['type_msg', 'Type a message', 'संदेश लिखें', 'संदेश लिहा'],
  ['connected', 'Connected', 'जुड़ा हुआ', 'जोडलेले'], ['offline', 'Disconnected, trying again…', 'कनेक्शन टूटा, फिर कोशिश हो रही है…', 'कनेक्शन तुटले, पुन्हा प्रयत्न सुरू…'],
  ['cat_Grains', 'Grains', 'अनाज', 'धान्य'], ['cat_Vegetables', 'Vegetables', 'सब्ज़ियां', 'भाज्या'], ['cat_Fruits', 'Fruits', 'फल', 'फळे'],
  ['cat_Pulses', 'Pulses', 'दालें', 'डाळी'], ['cat_Dairy', 'Dairy', 'डेयरी', 'दुग्धजन्य'], ['cat_Spices', 'Spices', 'मसाले', 'मसाले'], ['cat_Other', 'Other', 'अन्य', 'इतर']
];
const D = { en: {}, hi: {}, mr: {} };
rows.forEach(([k, ...v]) => ['en', 'hi', 'mr'].forEach((l, i) => { D[l][k] = v[i]; }));

const C = {
  en: {
    schemes: [['PM-KISAN', '₹6,000 a year in three instalments, paid straight to your bank account.'],
      ['Pradhan Mantri Fasal Bima Yojana', 'Crop insurance against drought, flood and pests at a low premium.'],
      ['Kisan Credit Card', 'Short-term farm loans at low interest for seeds, fertiliser and tools.'],
      ['Soil Health Card', 'Free soil test with advice on the right fertiliser for your field.']],
    tips: ['Test your soil before each season.', 'Water early in the morning to cut evaporation.',
      'Rotate crops to break pest cycles.', 'Check mandi prices before you harvest, not after.']
  },
  hi: {
    schemes: [['पीएम-किसान', 'साल में ₹6,000, तीन किस्तों में सीधे बैंक खाते में।'],
      ['फसल बीमा योजना', 'सूखा, बाढ़ और कीटों से फसल का बीमा, कम प्रीमियम पर।'],
      ['किसान क्रेडिट कार्ड', 'बीज, खाद और औज़ारों के लिए कम ब्याज पर अल्पकालीन कृषि ऋण।'],
      ['मृदा स्वास्थ्य कार्ड', 'मुफ़्त मिट्टी जाँच और खेत के लिए सही खाद की सलाह।']],
    tips: ['हर मौसम से पहले मिट्टी की जाँच करें।', 'वाष्पीकरण घटाने के लिए सुबह जल्दी सिंचाई करें।',
      'कीट चक्र तोड़ने के लिए फसल चक्र अपनाएं।', 'कटाई के बाद नहीं, पहले मंडी भाव देखें।']
  },
  mr: {
    schemes: [['पीएम-किसान', 'वर्षाला ₹६,००० तीन हप्त्यांत थेट बँक खात्यात.'],
      ['पीक विमा योजना', 'दुष्काळ, पूर आणि कीड यापासून पीक विमा, कमी हप्त्यात.'],
      ['किसान क्रेडिट कार्ड', 'बियाणे, खत व अवजारांसाठी कमी व्याजाने अल्पमुदतीचे कर्ज.'],
      ['मृदा आरोग्य पत्रिका', 'मोफत माती तपासणी आणि शेतासाठी योग्य खताचा सल्ला.']],
    tips: ['प्रत्येक हंगामापूर्वी माती तपासा.', 'बाष्पीभवन कमी करण्यासाठी पहाटे पाणी द्या.',
      'किडींचे चक्र तोडण्यासाठी पीक फेरपालट करा.', 'काढणीनंतर नव्हे, आधी मंडी भाव पाहा.']
  }
};

const Ctx = createContext();
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('ks_lang') || 'en');
  useEffect(() => { localStorage.setItem('ks_lang', lang); document.documentElement.lang = lang; }, [lang]);
  const t = k => D[lang][k] ?? D.en[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t, content: C[lang] }}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
