const DAVI_NAMES = new Set([
    'davi',
    'daviti',
    'დავი',
    'დავითი'
]);

const aliases = new Map();

function normalize(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/gu, '')
        .replace(/[’‘]/gu, "'")
        .trim()
        .replace(/[!?.,…:;]+$/u, '')
        .trim()
        .replace(/\s+/gu, ' ');
}

function addAliases(category, values) {
    for (const value of values) {
        aliases.set(normalize(value), category);
    }
}

addAliases('hi', [
    'hi', 'hello', 'hey', 'გამარჯობა', 'სალამი'
]);

addAliases('mood', [
    'mood', 'how are you', 'how are you doing',
    'როგორ ხარ', 'განწყობა'
]);

addAliases('nice', [
    'nice', 'compliment', 'compliment me',
    'კომპლიმენტი', 'კომპლიმენტი მითხარი'
]);

addAliases('roast', [
    'roast', 'roast me', 'გამეხუმრე'
]);

addAliases('tip', [
    'tip', 'advice', 'give me advice', 'რჩევა'
]);

addAliases('pick', ['pick', 'choose', 'აირჩიე']);
addAliases('rate', ['rate', 'rate me', 'შეფასება', 'შემაფასე']);
addAliases('luck', ['luck', 'იღბალი']);
addAliases('secret', ['secret', 'საიდუმლო']);
addAliases('help', ['help', 'დახმარება']);
addAliases('stop', ['stop', 'გაჩერდი']);
addAliases('thanks', ['thanks', 'thank you', 'მადლობა']);
addAliases('rude', ['rude', 'you are rude', 'უხეში ხარ']);
addAliases('really', ['really', 'მართლა']);
addAliases('why', ['why', 'რატომ']);
addAliases('yes', ['yes', 'yeah', 'კი', 'დიახ']);
addAliases('no', ['no', 'nope', 'არა']);

// Expanded conversational aliases.
addAliases('hi', [
    'hey there',
    'hello there',
    'hello again',
    'hi again',
    'hey kitsune',
    'სალამი კიცუნე',
    'გამარჯობა კიცუნე',
    'კიდევ გამარჯობა'
]);

addAliases('mood', [
    'how are you today',
    'how is it going',
    "how's it going",
    'how are things',
    'are you okay',
    'are you ok',
    'როგორ მიდის საქმე',
    'როგორ მიდის საქმეები',
    'დღეს როგორ ხარ',
    'კარგად ხარ'
]);

addAliases('thanks', [
    'thanks a lot',
    'thanks so much',
    'thank you so much',
    'thank you very much',
    'appreciate it',
    'i appreciate it',
    'ty',
    'tysm',
    'დიდი მადლობა',
    'ძალიან დიდი მადლობა',
    'გმადლობ',
    'გმადლობთ'
]);

addAliases('really', [
    'are you serious',
    'seriously',
    'for real',
    'you mean it',
    'do you mean it',
    'მართლა ამბობ',
    'სერიოზულად',
    'სერიოზულად ამბობ'
]);

addAliases('why', [
    'why is that',
    'why do you say that',
    'why would you say that',
    'რატომ ამბობ ამას',
    'რატომ ფიქრობ ასე',
    'რატომ ასე'
]);

addAliases('nice', [
    'say something nice',
    'tell me something nice',
    'give me a compliment',
    'კომპლიმენტი მითხარი',
    'მითხარი რამე კარგი',
    'რამე კარგი მითხარი'
]);

addAliases('roast', [
    'give me a roast',
    'tease me',
    'make fun of me',
    'ცოტა გამეხუმრე'
]);

addAliases('tip', [
    'give me a tip',
    'any advice',
    'some advice please',
    'რჩევა მომეცი',
    'მომეცი რჩევა',
    'რამე მირჩიე'
]);

addAliases('rude', [
    'that was rude',
    'you are being rude',
    'be nicer',
    'be nice to me',
    'easy on me',
    'ცოტა რბილად',
    'ნუ მეუხეშები',
    'ასე უხეშად ნუ მპასუხობ'
]);

addAliases('reaction_apology', [
    'sorry',
    'my bad',
    'i am sorry',
    "i'm sorry",
    'i apologize',
    'ბოდიში',
    'მაპატიე',
    'მაპატიე გთხოვ'
]);

addAliases('reaction_affection', [
    'you are sweet',
    'you are lovely',
    'you are cute',
    'you are beautiful',
    'კარგი ხარ',
    'ძალიან საყვარელი ხარ',
    'ლამაზი ხარ'
]);

addAliases('stop', [
    'bye',
    'goodbye',
    'see you',
    'see you later',
    'talk later',
    'stop please',
    'ნახვამდის',
    'დროებით',
    'მერე გნახავ',
    'შემდეგამდე'
]);
module.exports = { normalize, aliases, DAVI_NAMES };
