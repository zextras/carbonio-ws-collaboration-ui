/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { charToUnicode, unicodeToChar } from './textUtils';

const basicLatinCharacters = '! " # $ % & \' ( ) * + , - . /  < = > ? ` ~';
const latin1SupplementCharacters = '¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿ À';
const latinExtendedACharacters = 'Ā ā Ă ă Ą ą Ć ć Ĉ ĉ Ċ ċ Č č Ď ď Đ đ Ē ē Ĕ ĕ Ė ė Ę';
const latinExtendedBCharacters = 'Ĳ ĳ Ĵ ĵ Ķ ķ ĸ Ĺ ĺ Ļ ļ Ľ ľ Ŀ ŀ Ł ł Ń ń Ņ ņ Ň ň ŉ Ŋ';
const ipaExtensionsCharacters = 'ɐ ɑ ɒ ɓ ɔ ɕ ɖ ɗ ɘ ə ɚ ɛ ɜ ɝ ɞ ɟ ɠ ɡ ɢ ɣ ɤ ɥ ɦ ɧ ɨ ɩ';
const spacingModifierLettersCharacters = 'ʰ ʱ ʲ ʳ ʴ ʵ ʶ ʷ ʸ ʹ ʺ ʻ ʼ ʽ ʾ ʿ ˀ ˁ ˂ ˃ ˄ ˅';
const combiningDiacriticalCharacters = ' ̂ ̃ ̄ ̅ ̆ ̇ ̈ ̉ ̊ ̋ ̌ ̍ ̎ ̏ ̐ ̑ ̒';
const greekAndCopticCharacters = 'ʹ ͵ ͺ ; ΄ ΅ Ά · Έ Ή Ί Ό Ύ Ώ ΐ Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ';
const cyrillicCharacters = 'Ѐ Ё Ђ Ѓ Є Ѕ І Ї Ј Љ Њ Ћ Ќ Ѝ Ў Џ А Б В Г Д Е Ж З И Й К Л М';
const cyrillicSupplementCharacters = 'Ԁ ԁ Ԃ ԃ Ԅ ԅ Ԇ ԇ Ԉ ԉ Ԋ ԋ Ԍ ԍ Ԏ ԏ';
const armenianCharacters = 'Ա Բ Գ Դ Ե Զ Է Ը Թ Ժ Ի Լ Խ Ծ Կ Հ Ձ Ղ Ճ Մ Յ Ն Շ Ո Չ Պ Ջ';
const arabicCharacters = 'ڜ ڝ ڞ ڟ ڠ ڡ ڢ ڣ';
const syriacCharacters = 'ܕ ܖ ܗ ܘ ܙ ܚ ܛ ܜ ܝ ܞ ܟ ܠ ܡ ܢ ܣ ܤ ܥ ܦ ܧ ܨ ܩ ܪ ܫ ܬ';
const devanagariCharacters = 'ँ ं ः अ आ इ ई उ ऊ ऋ ऌ ऍ ऎ ए ऐ ऑ ऒ ओ औ क ख ग घ ङ च छ';
const bengaliCharacters = 'ঁ ং ঃ অ আ ই ঈ উ ঊ ঋ ঌ এ ঐ ও ঔ ক খ গ ঘ ঙ চ ছ জ ঝ';
const greekExtendedCharacters = 'ἀ ἁ ἂ ἃ ἄ ἅ ἆ ἇ Ἀ Ἁ Ἂ Ἃ Ἄ Ἅ Ἆ Ἇ ἐ ἑ ἒ ἓ ἔ ἕ Ἐ Ἑ Ἒ Ἓ Ἔ';
const cjkRadicalsSupplementCharacters = '⺀ ⺁ ⺂ ⺃ ⺄ ⺅ ⺆ ⺇ ⺈ ⺉ ⺊ ⺋ ⺌ ⺍ ⺎ ⺏ ⺐ ⺑';
const kangxiRadicalsCharacters = '⼀ ⼁ ⼂ ⼃ ⼄ ⼅ ⼆ ⼇ ⼈ ⼉ ⼊ ⼋ ⼌ ⼍ ⼎ ⼏ ⼐ ⼑ ⼒ ⼓ ⼔';
const hiraganaCharacters = 'ぁ あ ぃ い ぅ う ぇ え ぉ お か が き ぎ く ぐ け げ こ ご さ ざ し';

const basicLatinUnicode =
	'\\u0021\\u0020\\u0022\\u0020\\u0023\\u0020\\u0024\\u0020\\u0025\\u0020\\u0026\\u0020\\u0027\\u0020\\u0028\\u0020\\u0029\\u0020\\u002a\\u0020\\u002b\\u0020\\u002c\\u0020\\u002d\\u0020\\u002e\\u0020\\u002f\\u0020\\u0020\\u003c\\u0020\\u003d\\u0020\\u003e\\u0020\\u003f\\u0020\\u0060\\u0020\\u007e';
const latin1SupplementUnicode =
	'\\u00a1\\u0020\\u00a2\\u0020\\u00a3\\u0020\\u00a4\\u0020\\u00a5\\u0020\\u00a6\\u0020\\u00a7\\u0020\\u00a8\\u0020\\u00a9\\u0020\\u00aa\\u0020\\u00ab\\u0020\\u00ac\\u0020\\u00b5\\u0020\\u00b6\\u0020\\u00b7\\u0020\\u00b8\\u0020\\u00b9\\u0020\\u00ba\\u0020\\u00bb\\u0020\\u00bc\\u0020\\u00bd\\u0020\\u00be\\u0020\\u00bf\\u0020\\u00c0';
const latinExtendedAUnicode =
	'\\u0100\\u0020\\u0101\\u0020\\u0102\\u0020\\u0103\\u0020\\u0104\\u0020\\u0105\\u0020\\u0106\\u0020\\u0107\\u0020\\u0108\\u0020\\u0109\\u0020\\u010a\\u0020\\u010b\\u0020\\u010c\\u0020\\u010d\\u0020\\u010e\\u0020\\u010f\\u0020\\u0110\\u0020\\u0111\\u0020\\u0112\\u0020\\u0113\\u0020\\u0114\\u0020\\u0115\\u0020\\u0116\\u0020\\u0117\\u0020\\u0118';
const latinExtendedBUnicode =
	'\\u0132\\u0020\\u0133\\u0020\\u0134\\u0020\\u0135\\u0020\\u0136\\u0020\\u0137\\u0020\\u0138\\u0020\\u0139\\u0020\\u013a\\u0020\\u013b\\u0020\\u013c\\u0020\\u013d\\u0020\\u013e\\u0020\\u013f\\u0020\\u0140\\u0020\\u0141\\u0020\\u0142\\u0020\\u0143\\u0020\\u0144\\u0020\\u0145\\u0020\\u0146\\u0020\\u0147\\u0020\\u0148\\u0020\\u0149\\u0020\\u014a';
const ipaExtensionsUnicode =
	'\\u0250\\u0020\\u0251\\u0020\\u0252\\u0020\\u0253\\u0020\\u0254\\u0020\\u0255\\u0020\\u0256\\u0020\\u0257\\u0020\\u0258\\u0020\\u0259\\u0020\\u025a\\u0020\\u025b\\u0020\\u025c\\u0020\\u025d\\u0020\\u025e\\u0020\\u025f\\u0020\\u0260\\u0020\\u0261\\u0020\\u0262\\u0020\\u0263\\u0020\\u0264\\u0020\\u0265\\u0020\\u0266\\u0020\\u0267\\u0020\\u0268\\u0020\\u0269';
const spacingModifierLettersUnicode =
	'\\u02b0\\u0020\\u02b1\\u0020\\u02b2\\u0020\\u02b3\\u0020\\u02b4\\u0020\\u02b5\\u0020\\u02b6\\u0020\\u02b7\\u0020\\u02b8\\u0020\\u02b9\\u0020\\u02ba\\u0020\\u02bb\\u0020\\u02bc\\u0020\\u02bd\\u0020\\u02be\\u0020\\u02bf\\u0020\\u02c0\\u0020\\u02c1\\u0020\\u02c2\\u0020\\u02c3\\u0020\\u02c4\\u0020\\u02c5';
const combiningDiacriticalUnicode =
	'\\u0020\\u0302\\u0020\\u0303\\u0020\\u0304\\u0020\\u0305\\u0020\\u0306\\u0020\\u0307\\u0020\\u0308\\u0020\\u0309\\u0020\\u030a\\u0020\\u030b\\u0020\\u030c\\u0020\\u030d\\u0020\\u030e\\u0020\\u030f\\u0020\\u0310\\u0020\\u0311\\u0020\\u0312';
const greekAndCopticUnicode =
	'\\u0374\\u0020\\u0375\\u0020\\u037a\\u0020\\u037e\\u0020\\u0384\\u0020\\u0385\\u0020\\u0386\\u0020\\u0387\\u0020\\u0388\\u0020\\u0389\\u0020\\u038a\\u0020\\u038c\\u0020\\u038e\\u0020\\u038f\\u0020\\u0390\\u0020\\u0391\\u0020\\u0392\\u0020\\u0393\\u0020\\u0394\\u0020\\u0395\\u0020\\u0396\\u0020\\u0397\\u0020\\u0398\\u0020\\u0399\\u0020\\u039a\\u0020\\u039b';
const cyrillicUnicode =
	'\\u0400\\u0020\\u0401\\u0020\\u0402\\u0020\\u0403\\u0020\\u0404\\u0020\\u0405\\u0020\\u0406\\u0020\\u0407\\u0020\\u0408\\u0020\\u0409\\u0020\\u040a\\u0020\\u040b\\u0020\\u040c\\u0020\\u040d\\u0020\\u040e\\u0020\\u040f\\u0020\\u0410\\u0020\\u0411\\u0020\\u0412\\u0020\\u0413\\u0020\\u0414\\u0020\\u0415\\u0020\\u0416\\u0020\\u0417\\u0020\\u0418\\u0020\\u0419\\u0020\\u041a\\u0020\\u041b\\u0020\\u041c';
const cyrillicSupplementUnicode =
	'\\u0500\\u0020\\u0501\\u0020\\u0502\\u0020\\u0503\\u0020\\u0504\\u0020\\u0505\\u0020\\u0506\\u0020\\u0507\\u0020\\u0508\\u0020\\u0509\\u0020\\u050a\\u0020\\u050b\\u0020\\u050c\\u0020\\u050d\\u0020\\u050e\\u0020\\u050f';
const armenianUnicode =
	'\\u0531\\u0020\\u0532\\u0020\\u0533\\u0020\\u0534\\u0020\\u0535\\u0020\\u0536\\u0020\\u0537\\u0020\\u0538\\u0020\\u0539\\u0020\\u053a\\u0020\\u053b\\u0020\\u053c\\u0020\\u053d\\u0020\\u053e\\u0020\\u053f\\u0020\\u0540\\u0020\\u0541\\u0020\\u0542\\u0020\\u0543\\u0020\\u0544\\u0020\\u0545\\u0020\\u0546\\u0020\\u0547\\u0020\\u0548\\u0020\\u0549\\u0020\\u054a\\u0020\\u054b';
const arabicUnicode =
	'\\u069c\\u0020\\u069d\\u0020\\u069e\\u0020\\u069f\\u0020\\u06a0\\u0020\\u06a1\\u0020\\u06a2\\u0020\\u06a3';
const syriacUnicode =
	'\\u0715\\u0020\\u0716\\u0020\\u0717\\u0020\\u0718\\u0020\\u0719\\u0020\\u071a\\u0020\\u071b\\u0020\\u071c\\u0020\\u071d\\u0020\\u071e\\u0020\\u071f\\u0020\\u0720\\u0020\\u0721\\u0020\\u0722\\u0020\\u0723\\u0020\\u0724\\u0020\\u0725\\u0020\\u0726\\u0020\\u0727\\u0020\\u0728\\u0020\\u0729\\u0020\\u072a\\u0020\\u072b\\u0020\\u072c';
const devanagariUnicode =
	'\\u0901\\u0020\\u0902\\u0020\\u0903\\u0020\\u0905\\u0020\\u0906\\u0020\\u0907\\u0020\\u0908\\u0020\\u0909\\u0020\\u090a\\u0020\\u090b\\u0020\\u090c\\u0020\\u090d\\u0020\\u090e\\u0020\\u090f\\u0020\\u0910\\u0020\\u0911\\u0020\\u0912\\u0020\\u0913\\u0020\\u0914\\u0020\\u0915\\u0020\\u0916\\u0020\\u0917\\u0020\\u0918\\u0020\\u0919\\u0020\\u091a\\u0020\\u091b';
const bengaliUnicode =
	'\\u0981\\u0020\\u0982\\u0020\\u0983\\u0020\\u0985\\u0020\\u0986\\u0020\\u0987\\u0020\\u0988\\u0020\\u0989\\u0020\\u098a\\u0020\\u098b\\u0020\\u098c\\u0020\\u098f\\u0020\\u0990\\u0020\\u0993\\u0020\\u0994\\u0020\\u0995\\u0020\\u0996\\u0020\\u0997\\u0020\\u0998\\u0020\\u0999\\u0020\\u099a\\u0020\\u099b\\u0020\\u099c\\u0020\\u099d';
const greekExtendedUnicode =
	'\\u1f00\\u0020\\u1f01\\u0020\\u1f02\\u0020\\u1f03\\u0020\\u1f04\\u0020\\u1f05\\u0020\\u1f06\\u0020\\u1f07\\u0020\\u1f08\\u0020\\u1f09\\u0020\\u1f0a\\u0020\\u1f0b\\u0020\\u1f0c\\u0020\\u1f0d\\u0020\\u1f0e\\u0020\\u1f0f\\u0020\\u1f10\\u0020\\u1f11\\u0020\\u1f12\\u0020\\u1f13\\u0020\\u1f14\\u0020\\u1f15\\u0020\\u1f18\\u0020\\u1f19\\u0020\\u1f1a\\u0020\\u1f1b\\u0020\\u1f1c';
const cjkRadicalsSupplementUnicode =
	'\\u2e80\\u0020\\u2e81\\u0020\\u2e82\\u0020\\u2e83\\u0020\\u2e84\\u0020\\u2e85\\u0020\\u2e86\\u0020\\u2e87\\u0020\\u2e88\\u0020\\u2e89\\u0020\\u2e8a\\u0020\\u2e8b\\u0020\\u2e8c\\u0020\\u2e8d\\u0020\\u2e8e\\u0020\\u2e8f\\u0020\\u2e90\\u0020\\u2e91';
const kangxiRadicalsUnicode =
	'\\u2f00\\u0020\\u2f01\\u0020\\u2f02\\u0020\\u2f03\\u0020\\u2f04\\u0020\\u2f05\\u0020\\u2f06\\u0020\\u2f07\\u0020\\u2f08\\u0020\\u2f09\\u0020\\u2f0a\\u0020\\u2f0b\\u0020\\u2f0c\\u0020\\u2f0d\\u0020\\u2f0e\\u0020\\u2f0f\\u0020\\u2f10\\u0020\\u2f11\\u0020\\u2f12\\u0020\\u2f13\\u0020\\u2f14';
const hiraganaUnicode =
	'\\u3041\\u0020\\u3042\\u0020\\u3043\\u0020\\u3044\\u0020\\u3045\\u0020\\u3046\\u0020\\u3047\\u0020\\u3048\\u0020\\u3049\\u0020\\u304a\\u0020\\u304b\\u0020\\u304c\\u0020\\u304d\\u0020\\u304e\\u0020\\u304f\\u0020\\u3050\\u0020\\u3051\\u0020\\u3052\\u0020\\u3053\\u0020\\u3054\\u0020\\u3055\\u0020\\u3056\\u0020\\u3057';

describe('Unicode codification / decodification', () => {
	test('Encode some characters to unicode', () => {
		expect(charToUnicode(basicLatinCharacters)).toBe(basicLatinUnicode);
		expect(charToUnicode(latin1SupplementCharacters)).toBe(latin1SupplementUnicode);
		expect(charToUnicode(latinExtendedACharacters)).toBe(latinExtendedAUnicode);
		expect(charToUnicode(latinExtendedBCharacters)).toBe(latinExtendedBUnicode);
		expect(charToUnicode(ipaExtensionsCharacters)).toBe(ipaExtensionsUnicode);
		expect(charToUnicode(spacingModifierLettersCharacters)).toBe(spacingModifierLettersUnicode);
		expect(charToUnicode(combiningDiacriticalCharacters)).toBe(combiningDiacriticalUnicode);
		expect(charToUnicode(greekAndCopticCharacters)).toBe(greekAndCopticUnicode);
		expect(charToUnicode(cyrillicCharacters)).toBe(cyrillicUnicode);
		expect(charToUnicode(cyrillicSupplementCharacters)).toBe(cyrillicSupplementUnicode);
		expect(charToUnicode(armenianCharacters)).toBe(armenianUnicode);
		expect(charToUnicode(arabicCharacters)).toBe(arabicUnicode);
		expect(charToUnicode(syriacCharacters)).toBe(syriacUnicode);
		expect(charToUnicode(devanagariCharacters)).toBe(devanagariUnicode);
		expect(charToUnicode(bengaliCharacters)).toBe(bengaliUnicode);
		expect(charToUnicode(greekExtendedCharacters)).toBe(greekExtendedUnicode);
		expect(charToUnicode(cjkRadicalsSupplementCharacters)).toBe(cjkRadicalsSupplementUnicode);
		expect(charToUnicode(kangxiRadicalsCharacters)).toBe(kangxiRadicalsUnicode);
		expect(charToUnicode(hiraganaCharacters)).toBe(hiraganaUnicode);
	});

	test('Decode some unicode to characters', () => {
		expect(unicodeToChar(basicLatinUnicode)).toBe(basicLatinCharacters);
		expect(unicodeToChar(latin1SupplementUnicode)).toBe(latin1SupplementCharacters);
		expect(unicodeToChar(latinExtendedAUnicode)).toBe(latinExtendedACharacters);
		expect(unicodeToChar(latinExtendedBUnicode)).toBe(latinExtendedBCharacters);
		expect(unicodeToChar(ipaExtensionsUnicode)).toBe(ipaExtensionsCharacters);
		expect(unicodeToChar(spacingModifierLettersUnicode)).toBe(spacingModifierLettersCharacters);
		expect(unicodeToChar(combiningDiacriticalUnicode)).toBe(combiningDiacriticalCharacters);
		expect(unicodeToChar(greekAndCopticUnicode)).toBe(greekAndCopticCharacters);
		expect(unicodeToChar(cyrillicUnicode)).toBe(cyrillicCharacters);
		expect(unicodeToChar(cyrillicSupplementUnicode)).toBe(cyrillicSupplementCharacters);
		expect(unicodeToChar(armenianUnicode)).toBe(armenianCharacters);
		expect(unicodeToChar(arabicUnicode)).toBe(arabicCharacters);
		expect(unicodeToChar(syriacUnicode)).toBe(syriacCharacters);
		expect(unicodeToChar(devanagariUnicode)).toBe(devanagariCharacters);
		expect(unicodeToChar(bengaliUnicode)).toBe(bengaliCharacters);
		expect(unicodeToChar(greekExtendedUnicode)).toBe(greekExtendedCharacters);
		expect(unicodeToChar(cjkRadicalsSupplementUnicode)).toBe(cjkRadicalsSupplementCharacters);
		expect(unicodeToChar(kangxiRadicalsUnicode)).toBe(kangxiRadicalsCharacters);
		expect(unicodeToChar(hiraganaUnicode)).toBe(hiraganaCharacters);
	});
});
