import { fal } from '@fal-ai/client'
import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import type { VisualDirection, NPC } from '../../src/types/game'

// Configure fal.ai if key is available
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY })
}

// ================================================================
// R2 인물 이미지 매핑 (로컬 생성 이미지 → R2 버킷)
// ================================================================
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''
// R2_PUBLIC_URL 예시: https://pub-xxxx.r2.dev 또는 커스텀 도메인

const R2_FILENAME_MAP: Record<string, string> = {
  "엘리아나_portrait": "001_엘리아나_portrait",
  "엘리아나_tavern": "002_엘리아나_tavern",
  "엘리아나_market": "003_엘리아나_market",
  "엘리아나_library": "004_엘리아나_library",
  "엘리아나_talk": "005_엘리아나_talk",
  "엘리아나_serious": "006_엘리아나_serious",
  "엘리아나_happy": "007_엘리아나_happy",
  "엘리아나_action": "008_엘리아나_action",
  "세라핀_portrait": "009_세라핀_portrait",
  "세라핀_tavern": "010_세라핀_tavern",
  "세라핀_market": "011_세라핀_market",
  "세라핀_library": "012_세라핀_library",
  "세라핀_talk": "013_세라핀_talk",
  "세라핀_serious": "014_세라핀_serious",
  "세라핀_happy": "015_세라핀_happy",
  "세라핀_action": "016_세라핀_action",
  "이사벨_portrait": "017_이사벨_portrait",
  "이사벨_tavern": "018_이사벨_tavern",
  "이사벨_market": "019_이사벨_market",
  "이사벨_library": "020_이사벨_library",
  "이사벨_talk": "021_이사벨_talk",
  "이사벨_serious": "022_이사벨_serious",
  "이사벨_happy": "023_이사벨_happy",
  "이사벨_action": "024_이사벨_action",
  "마레나_portrait": "025_마레나_portrait",
  "마레나_tavern": "026_마레나_tavern",
  "마레나_market": "027_마레나_market",
  "마레나_library": "028_마레나_library",
  "마레나_talk": "029_마레나_talk",
  "마레나_serious": "030_마레나_serious",
  "마레나_happy": "031_마레나_happy",
  "마레나_action": "032_마레나_action",
  "제나_portrait": "033_제나_portrait",
  "제나_tavern": "034_제나_tavern",
  "제나_market": "035_제나_market",
  "제나_library": "036_제나_library",
  "제나_talk": "037_제나_talk",
  "제나_serious": "038_제나_serious",
  "제나_happy": "039_제나_happy",
  "제나_action": "040_제나_action",
  "아리엘_portrait": "041_아리엘_portrait",
  "아리엘_tavern": "042_아리엘_tavern",
  "아리엘_market": "043_아리엘_market",
  "아리엘_library": "044_아리엘_library",
  "아리엘_talk": "045_아리엘_talk",
  "아리엘_serious": "046_아리엘_serious",
  "아리엘_happy": "047_아리엘_happy",
  "아리엘_action": "048_아리엘_action",
  "도르나_portrait": "049_도르나_portrait",
  "도르나_tavern": "050_도르나_tavern",
  "도르나_market": "051_도르나_market",
  "도르나_library": "052_도르나_library",
  "도르나_talk": "053_도르나_talk",
  "도르나_serious": "054_도르나_serious",
  "도르나_happy": "055_도르나_happy",
  "도르나_action": "056_도르나_action",
  "루시아_portrait": "057_루시아_portrait",
  "루시아_tavern": "058_루시아_tavern",
  "루시아_market": "059_루시아_market",
  "루시아_library": "060_루시아_library",
  "루시아_talk": "061_루시아_talk",
  "루시아_serious": "062_루시아_serious",
  "루시아_happy": "063_루시아_happy",
  "루시아_action": "064_루시아_action",
  "셀린_portrait": "065_셀린_portrait",
  "셀린_tavern": "066_셀린_tavern",
  "셀린_market": "067_셀린_market",
  "셀린_library": "068_셀린_library",
  "셀린_talk": "069_셀린_talk",
  "셀린_serious": "070_셀린_serious",
  "셀린_happy": "071_셀린_happy",
  "셀린_action": "072_셀린_action",
  "피오나_portrait": "073_피오나_portrait",
  "피오나_tavern": "074_피오나_tavern",
  "피오나_market": "075_피오나_market",
  "피오나_library": "076_피오나_library",
  "피오나_talk": "077_피오나_talk",
  "피오나_serious": "078_피오나_serious",
  "피오나_happy": "079_피오나_happy",
  "피오나_action": "080_피오나_action",
  "나이아_portrait": "081_나이아_portrait",
  "나이아_tavern": "082_나이아_tavern",
  "나이아_market": "083_나이아_market",
  "나이아_library": "084_나이아_library",
  "나이아_talk": "085_나이아_talk",
  "나이아_serious": "086_나이아_serious",
  "나이아_happy": "087_나이아_happy",
  "나이아_action": "088_나이아_action",
  "브리아_portrait": "089_브리아_portrait",
  "브리아_tavern": "090_브리아_tavern",
  "브리아_market": "091_브리아_market",
  "브리아_library": "092_브리아_library",
  "브리아_talk": "093_브리아_talk",
  "브리아_serious": "094_브리아_serious",
  "브리아_happy": "095_브리아_happy",
  "브리아_action": "096_브리아_action",
  "타나_portrait": "097_타나_portrait",
  "타나_tavern": "098_타나_tavern",
  "타나_market": "099_타나_market",
  "타나_library": "100_타나_library",
  "타나_talk": "101_타나_talk",
  "타나_serious": "102_타나_serious",
  "타나_happy": "103_타나_happy",
  "타나_action": "104_타나_action",
  "소리아_portrait": "105_소리아_portrait",
  "소리아_tavern": "106_소리아_tavern",
  "소리아_market": "107_소리아_market",
  "소리아_library": "108_소리아_library",
  "소리아_talk": "109_소리아_talk",
  "소리아_serious": "110_소리아_serious",
  "소리아_happy": "111_소리아_happy",
  "소리아_action": "112_소리아_action",
  "이리나_portrait": "113_이리나_portrait",
  "이리나_tavern": "114_이리나_tavern",
  "이리나_market": "115_이리나_market",
  "이리나_library": "116_이리나_library",
  "이리나_talk": "117_이리나_talk",
  "이리나_serious": "118_이리나_serious",
  "이리나_happy": "119_이리나_happy",
  "이리나_action": "120_이리나_action",
  "아우로라_portrait": "121_아우로라_portrait",
  "아우로라_tavern": "122_아우로라_tavern",
  "아우로라_market": "123_아우로라_market",
  "아우로라_library": "124_아우로라_library",
  "아우로라_talk": "125_아우로라_talk",
  "아우로라_serious": "126_아우로라_serious",
  "아우로라_happy": "127_아우로라_happy",
  "아우로라_action": "128_아우로라_action",
  "베로니카_portrait": "129_베로니카_portrait",
  "베로니카_tavern": "130_베로니카_tavern",
  "베로니카_market": "131_베로니카_market",
  "베로니카_library": "132_베로니카_library",
  "베로니카_talk": "133_베로니카_talk",
  "베로니카_serious": "134_베로니카_serious",
  "베로니카_happy": "135_베로니카_happy",
  "베로니카_action": "136_베로니카_action",
  "류네_portrait": "137_류네_portrait",
  "류네_tavern": "138_류네_tavern",
  "류네_market": "139_류네_market",
  "류네_library": "140_류네_library",
  "류네_talk": "141_류네_talk",
  "류네_serious": "142_류네_serious",
  "류네_happy": "143_류네_happy",
  "류네_action": "144_류네_action",
  "엘로이즈_portrait": "145_엘로이즈_portrait",
  "엘로이즈_tavern": "146_엘로이즈_tavern",
  "엘로이즈_market": "147_엘로이즈_market",
  "엘로이즈_library": "148_엘로이즈_library",
  "엘로이즈_talk": "149_엘로이즈_talk",
  "엘로이즈_serious": "150_엘로이즈_serious",
  "엘로이즈_happy": "151_엘로이즈_happy",
  "엘로이즈_action": "152_엘로이즈_action",
  "미라_portrait": "153_미라_portrait",
  "미라_tavern": "154_미라_tavern",
  "미라_market": "155_미라_market",
  "미라_library": "156_미라_library",
  "미라_talk": "157_미라_talk",
  "미라_serious": "158_미라_serious",
  "미라_happy": "159_미라_happy",
  "미라_action": "160_미라_action",
  "린디아_portrait": "161_린디아_portrait",
  "린디아_tavern": "162_린디아_tavern",
  "린디아_market": "163_린디아_market",
  "린디아_library": "164_린디아_library",
  "린디아_talk": "165_린디아_talk",
  "린디아_serious": "166_린디아_serious",
  "린디아_happy": "167_린디아_happy",
  "린디아_action": "168_린디아_action",
  "제나이다_portrait": "169_제나이다_portrait",
  "제나이다_tavern": "170_제나이다_tavern",
  "제나이다_market": "171_제나이다_market",
  "제나이다_library": "172_제나이다_library",
  "제나이다_talk": "173_제나이다_talk",
  "제나이다_serious": "174_제나이다_serious",
  "제나이다_happy": "175_제나이다_happy",
  "제나이다_action": "176_제나이다_action",
  "아이야_portrait": "177_아이야_portrait",
  "아이야_tavern": "178_아이야_tavern",
  "아이야_market": "179_아이야_market",
  "아이야_library": "180_아이야_library",
  "아이야_talk": "181_아이야_talk",
  "아이야_serious": "182_아이야_serious",
  "아이야_happy": "183_아이야_happy",
  "아이야_action": "184_아이야_action",
  "베아트리체_portrait": "185_베아트리체_portrait",
  "베아트리체_tavern": "186_베아트리체_tavern",
  "베아트리체_market": "187_베아트리체_market",
  "베아트리체_library": "188_베아트리체_library",
  "베아트리체_talk": "189_베아트리체_talk",
  "베아트리체_serious": "190_베아트리체_serious",
  "베아트리체_happy": "191_베아트리체_happy",
  "베아트리체_action": "192_베아트리체_action",
  "타마라_portrait": "193_타마라_portrait",
  "타마라_tavern": "194_타마라_tavern",
  "타마라_market": "195_타마라_market",
  "타마라_library": "196_타마라_library",
  "타마라_talk": "197_타마라_talk",
  "타마라_serious": "198_타마라_serious",
  "타마라_happy": "199_타마라_happy",
  "타마라_action": "200_타마라_action",
  "이나_portrait": "201_이나_portrait",
  "이나_tavern": "202_이나_tavern",
  "이나_market": "203_이나_market",
  "이나_library": "204_이나_library",
  "이나_talk": "205_이나_talk",
  "이나_serious": "206_이나_serious",
  "이나_happy": "207_이나_happy",
  "이나_action": "208_이나_action",
  "레나_portrait": "209_레나_portrait",
  "레나_tavern": "210_레나_tavern",
  "레나_market": "211_레나_market",
  "레나_library": "212_레나_library",
  "레나_talk": "213_레나_talk",
  "레나_serious": "214_레나_serious",
  "레나_happy": "215_레나_happy",
  "레나_action": "216_레나_action",
  "발키리아_portrait": "217_발키리아_portrait",
  "발키리아_tavern": "218_발키리아_tavern",
  "발키리아_market": "219_발키리아_market",
  "발키리아_library": "220_발키리아_library",
  "발키리아_talk": "221_발키리아_talk",
  "발키리아_serious": "222_발키리아_serious",
  "발키리아_happy": "223_발키리아_happy",
  "발키리아_action": "224_발키리아_action",
  "아나_portrait": "225_아나_portrait",
  "아나_tavern": "226_아나_tavern",
  "아나_market": "227_아나_market",
  "아나_library": "228_아나_library",
  "아나_talk": "229_아나_talk",
  "아나_serious": "230_아나_serious",
  "아나_happy": "231_아나_happy",
  "아나_action": "232_아나_action",
  "셰나_portrait": "233_셰나_portrait",
  "셰나_tavern": "234_셰나_tavern",
  "셰나_market": "235_셰나_market",
  "셰나_library": "236_셰나_library",
  "셰나_talk": "237_셰나_talk",
  "셰나_serious": "238_셰나_serious",
  "셰나_happy": "239_셰나_happy",
  "셰나_action": "240_셰나_action",
  "라이라_portrait": "241_라이라_portrait",
  "라이라_tavern": "242_라이라_tavern",
  "라이라_market": "243_라이라_market",
  "라이라_library": "244_라이라_library",
  "라이라_talk": "245_라이라_talk",
  "라이라_serious": "246_라이라_serious",
  "라이라_happy": "247_라이라_happy",
  "라이라_action": "248_라이라_action",
  "미나_portrait": "249_미나_portrait",
  "미나_tavern": "250_미나_tavern",
  "미나_market": "251_미나_market",
  "미나_library": "252_미나_library",
  "미나_talk": "253_미나_talk",
  "미나_serious": "254_미나_serious",
  "미나_happy": "255_미나_happy",
  "미나_action": "256_미나_action",
  "자라_portrait": "257_자라_portrait",
  "자라_tavern": "258_자라_tavern",
  "자라_market": "259_자라_market",
  "자라_library": "260_자라_library",
  "자라_talk": "261_자라_talk",
  "자라_serious": "262_자라_serious",
  "자라_happy": "263_자라_happy",
  "자라_action": "264_자라_action",
  "이오나_portrait": "265_이오나_portrait",
  "이오나_tavern": "266_이오나_tavern",
  "이오나_market": "267_이오나_market",
  "이오나_library": "268_이오나_library",
  "이오나_talk": "269_이오나_talk",
  "이오나_serious": "270_이오나_serious",
  "이오나_happy": "271_이오나_happy",
  "이오나_action": "272_이오나_action",
  "테사_portrait": "273_테사_portrait",
  "테사_tavern": "274_테사_tavern",
  "테사_market": "275_테사_market",
  "테사_library": "276_테사_library",
  "테사_talk": "277_테사_talk",
  "테사_serious": "278_테사_serious",
  "테사_happy": "279_테사_happy",
  "테사_action": "280_테사_action",
  "나라_portrait": "281_나라_portrait",
  "나라_tavern": "282_나라_tavern",
  "나라_market": "283_나라_market",
  "나라_library": "284_나라_library",
  "나라_talk": "285_나라_talk",
  "나라_serious": "286_나라_serious",
  "나라_happy": "287_나라_happy",
  "나라_action": "288_나라_action",
  "아스트리드_portrait": "289_아스트리드_portrait",
  "아스트리드_tavern": "290_아스트리드_tavern",
  "아스트리드_market": "291_아스트리드_market",
  "아스트리드_library": "292_아스트리드_library",
  "아스트리드_talk": "293_아스트리드_talk",
  "아스트리드_serious": "294_아스트리드_serious",
  "아스트리드_happy": "295_아스트리드_happy",
  "아스트리드_action": "296_아스트리드_action",
  "섀도퀸_portrait": "297_섀도퀸_portrait",
  "섀도퀸_tavern": "298_섀도퀸_tavern",
  "섀도퀸_market": "299_섀도퀸_market",
  "섀도퀸_library": "300_섀도퀸_library",
  "섀도퀸_talk": "301_섀도퀸_talk",
  "섀도퀸_serious": "302_섀도퀸_serious",
  "섀도퀸_happy": "303_섀도퀸_happy",
  "섀도퀸_action": "304_섀도퀸_action",
  "린_portrait": "305_린_portrait",
  "린_tavern": "306_린_tavern",
  "린_market": "307_린_market",
  "린_library": "308_린_library",
  "린_talk": "309_린_talk",
  "린_serious": "310_린_serious",
  "린_happy": "311_린_happy",
  "린_action": "312_린_action",
  "피아_portrait": "313_피아_portrait",
  "피아_tavern": "314_피아_tavern",
  "피아_market": "315_피아_market",
  "피아_library": "316_피아_library",
  "피아_talk": "317_피아_talk",
  "피아_serious": "318_피아_serious",
  "피아_happy": "319_피아_happy",
  "피아_action": "320_피아_action",
  "에바_portrait": "321_에바_portrait",
  "에바_tavern": "322_에바_tavern",
  "에바_market": "323_에바_market",
  "에바_library": "324_에바_library",
  "에바_talk": "325_에바_talk",
  "에바_serious": "326_에바_serious",
  "에바_happy": "327_에바_happy",
  "에바_action": "328_에바_action",
  "케이_portrait": "329_케이_portrait",
  "케이_tavern": "330_케이_tavern",
  "케이_market": "331_케이_market",
  "케이_library": "332_케이_library",
  "케이_talk": "333_케이_talk",
  "케이_serious": "334_케이_serious",
  "케이_happy": "335_케이_happy",
  "케이_action": "336_케이_action",
  "유나_portrait": "337_유나_portrait",
  "유나_tavern": "338_유나_tavern",
  "유나_market": "339_유나_market",
  "유나_library": "340_유나_library",
  "유나_talk": "341_유나_talk",
  "유나_serious": "342_유나_serious",
  "유나_happy": "343_유나_happy",
  "유나_action": "344_유나_action",
  "카라_portrait": "345_카라_portrait",
  "카라_tavern": "346_카라_tavern",
  "카라_market": "347_카라_market",
  "카라_library": "348_카라_library",
  "카라_talk": "349_카라_talk",
  "카라_serious": "350_카라_serious",
  "카라_happy": "351_카라_happy",
  "카라_action": "352_카라_action",
  "루아_portrait": "353_루아_portrait",
  "루아_tavern": "354_루아_tavern",
  "루아_market": "355_루아_market",
  "루아_library": "356_루아_library",
  "루아_talk": "357_루아_talk",
  "루아_serious": "358_루아_serious",
  "루아_happy": "359_루아_happy",
  "루아_action": "360_루아_action",
  "다이아나_portrait": "361_다이아나_portrait",
  "다이아나_tavern": "362_다이아나_tavern",
  "다이아나_market": "363_다이아나_market",
  "다이아나_library": "364_다이아나_library",
  "다이아나_talk": "365_다이아나_talk",
  "다이아나_serious": "366_다이아나_serious",
  "다이아나_happy": "367_다이아나_happy",
  "다이아나_action": "368_다이아나_action",
  "코그나_portrait": "369_코그나_portrait",
  "코그나_tavern": "370_코그나_tavern",
  "코그나_market": "371_코그나_market",
  "코그나_library": "372_코그나_library",
  "코그나_talk": "373_코그나_talk",
  "코그나_serious": "374_코그나_serious",
  "코그나_happy": "375_코그나_happy",
  "코그나_action": "376_코그나_action",
  "레나스팀_portrait": "377_레나스팀_portrait",
  "레나스팀_tavern": "378_레나스팀_tavern",
  "레나스팀_market": "379_레나스팀_market",
  "레나스팀_library": "380_레나스팀_library",
  "레나스팀_talk": "381_레나스팀_talk",
  "레나스팀_serious": "382_레나스팀_serious",
  "레나스팀_happy": "383_레나스팀_happy",
  "레나스팀_action": "384_레나스팀_action",
  "아이다_portrait": "385_아이다_portrait",
  "아이다_tavern": "386_아이다_tavern",
  "아이다_market": "387_아이다_market",
  "아이다_library": "388_아이다_library",
  "아이다_talk": "389_아이다_talk",
  "아이다_serious": "390_아이다_serious",
  "아이다_happy": "391_아이다_happy",
  "아이다_action": "392_아이다_action",
  "크리스_portrait": "393_크리스_portrait",
  "크리스_tavern": "394_크리스_tavern",
  "크리스_market": "395_크리스_market",
  "크리스_library": "396_크리스_library",
  "크리스_talk": "397_크리스_talk",
  "크리스_serious": "398_크리스_serious",
  "크리스_happy": "399_크리스_happy",
  "크리스_action": "400_크리스_action",
  "테키_portrait": "401_테키_portrait",
  "테키_tavern": "402_테키_tavern",
  "테키_market": "403_테키_market",
  "테키_library": "404_테키_library",
  "테키_talk": "405_테키_talk",
  "테키_serious": "406_테키_serious",
  "테키_happy": "407_테키_happy",
  "테키_action": "408_테키_action",
  "제니_portrait": "409_제니_portrait",
  "제니_tavern": "410_제니_tavern",
  "제니_market": "411_제니_market",
  "제니_library": "412_제니_library",
  "제니_talk": "413_제니_talk",
  "제니_serious": "414_제니_serious",
  "제니_happy": "415_제니_happy",
  "제니_action": "416_제니_action",
  "알마_portrait": "417_알마_portrait",
  "알마_tavern": "418_알마_tavern",
  "알마_market": "419_알마_market",
  "알마_library": "420_알마_library",
  "알마_talk": "421_알마_talk",
  "알마_serious": "422_알마_serious",
  "알마_happy": "423_알마_happy",
  "알마_action": "424_알마_action",
  "세레나_portrait": "425_세레나_portrait",
  "세레나_tavern": "426_세레나_tavern",
  "세레나_market": "427_세레나_market",
  "세레나_library": "428_세레나_library",
  "세레나_talk": "429_세레나_talk",
  "세레나_serious": "430_세레나_serious",
  "세레나_happy": "431_세레나_happy",
  "세레나_action": "432_세레나_action",
  "이브_portrait": "433_이브_portrait",
  "이브_tavern": "434_이브_tavern",
  "이브_market": "435_이브_market",
  "이브_library": "436_이브_library",
  "이브_talk": "437_이브_talk",
  "이브_serious": "438_이브_serious",
  "이브_happy": "439_이브_happy",
  "이브_action": "440_이브_action",
  "클라리아_portrait": "441_클라리아_portrait",
  "클라리아_tavern": "442_클라리아_tavern",
  "클라리아_market": "443_클라리아_market",
  "클라리아_library": "444_클라리아_library",
  "클라리아_talk": "445_클라리아_talk",
  "클라리아_serious": "446_클라리아_serious",
  "클라리아_happy": "447_클라리아_happy",
  "클라리아_action": "448_클라리아_action",
  "도나_portrait": "449_도나_portrait",
  "도나_tavern": "450_도나_tavern",
  "도나_market": "451_도나_market",
  "도나_library": "452_도나_library",
  "도나_talk": "453_도나_talk",
  "도나_serious": "454_도나_serious",
  "도나_happy": "455_도나_happy",
  "도나_action": "456_도나_action",
  "오라_portrait": "457_오라_portrait",
  "오라_tavern": "458_오라_tavern",
  "오라_market": "459_오라_market",
  "오라_library": "460_오라_library",
  "오라_talk": "461_오라_talk",
  "오라_serious": "462_오라_serious",
  "오라_happy": "463_오라_happy",
  "오라_action": "464_오라_action",
  "네이아_portrait": "465_네이아_portrait",
  "네이아_tavern": "466_네이아_tavern",
  "네이아_market": "467_네이아_market",
  "네이아_library": "468_네이아_library",
  "네이아_talk": "469_네이아_talk",
  "네이아_serious": "470_네이아_serious",
  "네이아_happy": "471_네이아_happy",
  "네이아_action": "472_네이아_action",
  "로사_portrait": "473_로사_portrait",
  "로사_tavern": "474_로사_tavern",
  "로사_market": "475_로사_market",
  "로사_library": "476_로사_library",
  "로사_talk": "477_로사_talk",
  "로사_serious": "478_로사_serious",
  "로사_happy": "479_로사_happy",
  "로사_action": "480_로사_action",
  "마야_portrait": "481_마야_portrait",
  "마야_tavern": "482_마야_tavern",
  "마야_market": "483_마야_market",
  "마야_library": "484_마야_library",
  "마야_talk": "485_마야_talk",
  "마야_serious": "486_마야_serious",
  "마야_happy": "487_마야_happy",
  "마야_action": "488_마야_action",
  "니나_portrait": "489_니나_portrait",
  "니나_tavern": "490_니나_tavern",
  "니나_market": "491_니나_market",
  "니나_library": "492_니나_library",
  "니나_talk": "493_니나_talk",
  "니나_serious": "494_니나_serious",
  "니나_happy": "495_니나_happy",
  "니나_action": "496_니나_action",
  "에리카_portrait": "497_에리카_portrait",
  "에리카_tavern": "498_에리카_tavern",
  "에리카_market": "499_에리카_market",
  "에리카_library": "500_에리카_library",
  "에리카_talk": "501_에리카_talk",
  "에리카_serious": "502_에리카_serious",
  "에리카_happy": "503_에리카_happy",
  "에리카_action": "504_에리카_action",
  "라나_portrait": "505_라나_portrait",
  "라나_tavern": "506_라나_tavern",
  "라나_market": "507_라나_market",
  "라나_library": "508_라나_library",
  "라나_talk": "509_라나_talk",
  "라나_serious": "510_라나_serious",
  "라나_happy": "511_라나_happy",
  "라나_action": "512_라나_action",
  "이나웹_portrait": "513_이나웹_portrait",
  "이나웹_tavern": "514_이나웹_tavern",
  "이나웹_market": "515_이나웹_market",
  "이나웹_library": "516_이나웹_library",
  "이나웹_talk": "517_이나웹_talk",
  "이나웹_serious": "518_이나웹_serious",
  "이나웹_happy": "519_이나웹_happy",
  "이나웹_action": "520_이나웹_action",
  "아에라_portrait": "521_아에라_portrait",
  "아에라_tavern": "522_아에라_tavern",
  "아에라_market": "523_아에라_market",
  "아에라_library": "524_아에라_library",
  "아에라_talk": "525_아에라_talk",
  "아에라_serious": "526_아에라_serious",
  "아에라_happy": "527_아에라_happy",
  "아에라_action": "528_아에라_action",
  "비르_portrait": "529_비르_portrait",
  "비르_tavern": "530_비르_tavern",
  "비르_market": "531_비르_market",
  "비르_library": "532_비르_library",
  "비르_talk": "533_비르_talk",
  "비르_serious": "534_비르_serious",
  "비르_happy": "535_비르_happy",
  "비르_action": "536_비르_action",
  "에코_portrait": "537_에코_portrait",
  "에코_tavern": "538_에코_tavern",
  "에코_market": "539_에코_market",
  "에코_library": "540_에코_library",
  "에코_talk": "541_에코_talk",
  "에코_serious": "542_에코_serious",
  "에코_happy": "543_에코_happy",
  "에코_action": "544_에코_action",
  "루나_portrait": "545_루나_portrait",
  "루나_tavern": "546_루나_tavern",
  "루나_market": "547_루나_market",
  "루나_library": "548_루나_library",
  "루나_talk": "549_루나_talk",
  "루나_serious": "550_루나_serious",
  "루나_happy": "551_루나_happy",
  "루나_action": "552_루나_action",
  "실_portrait": "553_실_portrait",
  "실_tavern": "554_실_tavern",
  "실_market": "555_실_market",
  "실_library": "556_실_library",
  "실_talk": "557_실_talk",
  "실_serious": "558_실_serious",
  "실_happy": "559_실_happy",
  "실_action": "560_실_action",
  "아이스타_portrait": "561_아이스타_portrait",
  "아이스타_tavern": "562_아이스타_tavern",
  "아이스타_market": "563_아이스타_market",
  "아이스타_library": "564_아이스타_library",
  "아이스타_talk": "565_아이스타_talk",
  "아이스타_serious": "566_아이스타_serious",
  "아이스타_happy": "567_아이스타_happy",
  "아이스타_action": "568_아이스타_action",
  "베나_portrait": "569_베나_portrait",
  "베나_tavern": "570_베나_tavern",
  "베나_market": "571_베나_market",
  "베나_library": "572_베나_library",
  "베나_talk": "573_베나_talk",
  "베나_serious": "574_베나_serious",
  "베나_happy": "575_베나_happy",
  "베나_action": "576_베나_action",
  "마르타_portrait": "577_마르타_portrait",
  "마르타_tavern": "578_마르타_tavern",
  "마르타_market": "579_마르타_market",
  "마르타_library": "580_마르타_library",
  "마르타_talk": "581_마르타_talk",
  "마르타_serious": "582_마르타_serious",
  "마르타_happy": "583_마르타_happy",
  "마르타_action": "584_마르타_action",
  "헬가_portrait": "585_헬가_portrait",
  "헬가_tavern": "586_헬가_tavern",
  "헬가_market": "587_헬가_market",
  "헬가_library": "588_헬가_library",
  "헬가_talk": "589_헬가_talk",
  "헬가_serious": "590_헬가_serious",
  "헬가_happy": "591_헬가_happy",
  "헬가_action": "592_헬가_action",
  "소냐_portrait": "593_소냐_portrait",
  "소냐_tavern": "594_소냐_tavern",
  "소냐_market": "595_소냐_market",
  "소냐_library": "596_소냐_library",
  "소냐_talk": "597_소냐_talk",
  "소냐_serious": "598_소냐_serious",
  "소냐_happy": "599_소냐_happy",
  "소냐_action": "600_소냐_action",
  "리아_portrait": "601_리아_portrait",
  "리아_tavern": "602_리아_tavern",
  "리아_market": "603_리아_market",
  "리아_library": "604_리아_library",
  "리아_talk": "605_리아_talk",
  "리아_serious": "606_리아_serious",
  "리아_happy": "607_리아_happy",
  "리아_action": "608_리아_action",
  "나나_portrait": "609_나나_portrait",
  "나나_tavern": "610_나나_tavern",
  "나나_market": "611_나나_market",
  "나나_library": "612_나나_library",
  "나나_talk": "613_나나_talk",
  "나나_serious": "614_나나_serious",
  "나나_happy": "615_나나_happy",
  "나나_action": "616_나나_action",
  "베로_portrait": "617_베로_portrait",
  "베로_tavern": "618_베로_tavern",
  "베로_market": "619_베로_market",
  "베로_library": "620_베로_library",
  "베로_talk": "621_베로_talk",
  "베로_serious": "622_베로_serious",
  "베로_happy": "623_베로_happy",
  "베로_action": "624_베로_action",
  "브루나_portrait": "625_브루나_portrait",
  "브루나_tavern": "626_브루나_tavern",
  "브루나_market": "627_브루나_market",
  "브루나_library": "628_브루나_library",
  "브루나_talk": "629_브루나_talk",
  "브루나_serious": "630_브루나_serious",
  "브루나_happy": "631_브루나_happy",
  "브루나_action": "632_브루나_action",
  "스텔라_portrait": "633_스텔라_portrait",
  "스텔라_tavern": "634_스텔라_tavern",
  "스텔라_market": "635_스텔라_market",
  "스텔라_library": "636_스텔라_library",
  "스텔라_talk": "637_스텔라_talk",
  "스텔라_serious": "638_스텔라_serious",
  "스텔라_happy": "639_스텔라_happy",
  "스텔라_action": "640_스텔라_action",
  "유리_portrait": "641_유리_portrait",
  "유리_tavern": "642_유리_tavern",
  "유리_market": "643_유리_market",
  "유리_library": "644_유리_library",
  "유리_talk": "645_유리_talk",
  "유리_serious": "646_유리_serious",
  "유리_happy": "647_유리_happy",
  "유리_action": "648_유리_action",
  "레아_portrait": "649_레아_portrait",
  "레아_tavern": "650_레아_tavern",
  "레아_market": "651_레아_market",
  "레아_library": "652_레아_library",
  "레아_talk": "653_레아_talk",
  "레아_serious": "654_레아_serious",
  "레아_happy": "655_레아_happy",
  "레아_action": "656_레아_action",
  "크라_portrait": "657_크라_portrait",
  "크라_tavern": "658_크라_tavern",
  "크라_market": "659_크라_market",
  "크라_library": "660_크라_library",
  "크라_talk": "661_크라_talk",
  "크라_serious": "662_크라_serious",
  "크라_happy": "663_크라_happy",
  "크라_action": "664_크라_action",
  "제나마켓_portrait": "665_제나마켓_portrait",
  "제나마켓_tavern": "666_제나마켓_tavern",
  "제나마켓_market": "667_제나마켓_market",
  "제나마켓_library": "668_제나마켓_library",
  "제나마켓_talk": "669_제나마켓_talk",
  "제나마켓_serious": "670_제나마켓_serious",
  "제나마켓_happy": "671_제나마켓_happy",
  "제나마켓_action": "672_제나마켓_action",
  "올가_portrait": "673_올가_portrait",
  "올가_tavern": "674_올가_tavern",
  "올가_market": "675_올가_market",
  "올가_library": "676_올가_library",
  "올가_talk": "677_올가_talk",
  "올가_serious": "678_올가_serious",
  "올가_happy": "679_올가_happy",
  "올가_action": "680_올가_action",
  "아사_portrait": "681_아사_portrait",
  "아사_tavern": "682_아사_tavern",
  "아사_market": "683_아사_market",
  "아사_library": "684_아사_library",
  "아사_talk": "685_아사_talk",
  "아사_serious": "686_아사_serious",
  "아사_happy": "687_아사_happy",
  "아사_action": "688_아사_action",
  "이나트레이드_portrait": "689_이나트레이드_portrait",
  "이나트레이드_tavern": "690_이나트레이드_tavern",
  "이나트레이드_market": "691_이나트레이드_market",
  "이나트레이드_library": "692_이나트레이드_library",
  "이나트레이드_talk": "693_이나트레이드_talk",
  "이나트레이드_serious": "694_이나트레이드_serious",
  "이나트레이드_happy": "695_이나트레이드_happy",
  "이나트레이드_action": "696_이나트레이드_action",
  "안나_portrait": "697_안나_portrait",
  "안나_tavern": "698_안나_tavern",
  "안나_market": "699_안나_market",
  "안나_library": "700_안나_library",
  "안나_talk": "701_안나_talk",
  "안나_serious": "702_안나_serious",
  "안나_happy": "703_안나_happy",
  "안나_action": "704_안나_action",
  "마사_portrait": "705_마사_portrait",
  "마사_tavern": "706_마사_tavern",
  "마사_market": "707_마사_market",
  "마사_library": "708_마사_library",
  "마사_talk": "709_마사_talk",
  "마사_serious": "710_마사_serious",
  "마사_happy": "711_마사_happy",
  "마사_action": "712_마사_action",
  "기나_portrait": "713_기나_portrait",
  "기나_tavern": "714_기나_tavern",
  "기나_market": "715_기나_market",
  "기나_library": "716_기나_library",
  "기나_talk": "717_기나_talk",
  "기나_serious": "718_기나_serious",
  "기나_happy": "719_기나_happy",
  "기나_action": "720_기나_action"
}

const EMOTION_TO_SCENE: Record<string, string> = {
  neutral: 'talk',
  happy: 'happy',
  angry: 'serious',
  sad: 'serious',
  surprised: 'talk',
  serious: 'serious',
  smug: 'happy',
}

/**
 * NPC 이름 + 씬/감정으로 R2 URL 반환
 * 매핑에 없으면 null 반환 → 기존 fal.ai fallback 사용
 */
function getR2NpcUrl(npcName: string, scene: string): string | null {
  if (!R2_PUBLIC_URL) return null
  const key = `${npcName}_${scene}`
  const filename = R2_FILENAME_MAP[key]
  if (!filename) return null
  return `${R2_PUBLIC_URL}/${filename}_00001_.png`
}


// ---------- Download & persist FAL CDN images locally ----------
const PUBLIC_DIR = path.join(process.cwd(), 'public')

async function downloadToLocal(
  cdnUrl: string,
  subdir: 'map' | 'npcs' | 'scenes',
  filename: string
): Promise<string> {
  try {
    const dir = path.join(PUBLIC_DIR, 'images', subdir)
    await fs.ensureDir(dir)

    // Determine extension from content-type or URL
    const ext = cdnUrl.includes('.png') ? '.png' : '.jpeg'
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_') + ext
    const filePath = path.join(dir, safeName)

    const res = await fetch(cdnUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    const localUrl = `/images/${subdir}/${safeName}`
    console.log(`[Image] Saved locally: ${localUrl} (${(buffer.length / 1024).toFixed(0)} KB)`)
    return localUrl
  } catch (err) {
    console.error(`[Image] Failed to download ${cdnUrl}:`, err)
    // Return original CDN URL as fallback
    return cdnUrl
  }
}

function shortHash(): string {
  return crypto.randomBytes(4).toString('hex')
}

// ---------- Placeholder SVG Generator (inline data URLs) ----------
function placeholderDataUrl(type: 'map' | 'portrait' | 'scene', label: string): string {
  let svg: string

  if (type === 'map') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="756" viewBox="0 0 1344 756">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:#1a3a4a"/>
      <stop offset="100%" style="stop-color:#0a1a2a"/>
    </radialGradient>
  </defs>
  <rect width="1344" height="756" fill="url(#bg)"/>
  <rect x="20" y="20" width="1304" height="716" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.5"/>
  <ellipse cx="420" cy="380" rx="220" ry="150" fill="#3d7a35" opacity="0.8"/>
  <ellipse cx="900" cy="360" rx="200" ry="180" fill="#3d7a35" opacity="0.8"/>
  <ellipse cx="650" cy="500" rx="50" ry="35" fill="#2d5a27" opacity="0.8"/>
  <text x="672" y="60" font-family="serif" font-size="28" fill="#D4AF37" text-anchor="middle">${label}</text>
  <text x="672" y="720" font-family="serif" font-size="14" fill="#a09070" text-anchor="middle">세계 지도</text>
  <text x="1260" y="100" font-family="serif" font-size="20" fill="#D4AF37" text-anchor="middle">N</text>
</svg>`
  } else if (type === 'portrait') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%">
      <stop offset="0%" style="stop-color:#2a1a3a"/>
      <stop offset="100%" style="stop-color:#0a0a15"/>
    </radialGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <rect x="5" y="5" width="390" height="590" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.4"/>
  <ellipse cx="200" cy="160" rx="60" ry="70" fill="#3a2a4a" opacity="0.8"/>
  <rect x="140" y="220" width="120" height="200" rx="10" fill="#3a2a4a" opacity="0.7"/>
  <text x="200" y="560" font-family="serif" font-size="16" fill="#D4AF37" text-anchor="middle">${label}</text>
</svg>`
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="756" viewBox="0 0 1344 756">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a20"/>
      <stop offset="100%" style="stop-color:#1a0a2e"/>
    </linearGradient>
  </defs>
  <rect width="1344" height="756" fill="url(#sky)"/>
  <polygon points="0,756 200,350 400,756" fill="#1a1a3a" opacity="0.9"/>
  <polygon points="300,756 550,300 800,756" fill="#15152e" opacity="0.9"/>
  <polygon points="700,756 950,320 1200,756" fill="#1a1a3a" opacity="0.9"/>
  <rect x="0" y="620" width="1344" height="136" fill="#0d0d20"/>
  <text x="672" y="690" font-family="serif" font-size="18" fill="#D4AF37" text-anchor="middle">${label.slice(0, 60)}</text>
</svg>`
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// ---------- Main Image Generation Functions (stateless - no file I/O) ----------

// 💡 비주얼 노벨/애니메이션 스타일에 최적화 (SDXL map/portrait 용)
const SDXL_PREFIX = "(masterpiece, best quality, highres:1.2), visual novel CG art style, 2d anime illustration, vibrant cinematic lighting, flat color, clear outlines, safe fantasy artwork";

// 💡 실사풍/기괴한 인체 방지 (SDXL 전용)
const ANIMAGINE_NEGATIVE = "(worst quality, low quality, normal quality:1.4), (realistic, photorealistic, 3d, lip, nose:1.3), bad anatomy, bad face, asymmetrical eyes, malformed mouth, bad hands, missing fingers, extra digit, ugly, deformed, text, watermark, error, blurry, monochrome, duplicate body";

// 💡 FLUX Schnell: 씬 이미지용 빠른 프롬프트 접두사 (~2-4s, 4 steps)
// FLUX는 natural language prompt에 최적화 — 태그 스타일 대신 문장형 사용
const FLUX_SCENE_PREFIX = "fantasy game scene, anime illustration style, vibrant cinematic lighting, detailed background,";

function determineComposition(description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes('kiss') || desc.includes('whisper') || desc.includes('intimate') || desc.includes('seductive') || desc.includes('breath')) {
    return "extreme close-up, focused on faces and expressions, intimate proximity, shallow depth of field, blurred background";
  }
  if (desc.includes('hug') || desc.includes('embrace') || desc.includes('talking') || desc.includes('holding hands') || desc.includes('looking at each other')) {
    return "medium shot, upper body, two characters interacting closely, emotional tension, focus on character chemistry";
  }
  if (desc.includes('character') || desc.includes('standing') || desc.includes('sitting')) {
    return "cowboy shot, medium full shot, character-centric, detailed character features";
  }

  return "wide shot, cinematic composition, character in environment";
}

export async function generateMapImage(
  worldName: string,
  _worldLore: string,
  continents: Array<{ name: string }>,
  falKeyOverride?: string
): Promise<string> {
  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('map', worldName)
  }

  try {
    fal.config({ credentials: falKey })
    const prompt = `${SDXL_PREFIX}fantasy world map illustration, parchment texture, hand-drawn, top-down aerial view, two large continents named ${continents.map(c => c.name).join(' and ')}, mountains, forests, rivers, ocean with decorative waves, compass rose, decorative border, medieval fantasy cartography style, warm golden-brown colors, high quality`

    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 7.0,
        scheduler: "Euler a",
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('map', worldName)
    return downloadToLocal(cdnUrl, 'map', `world-map-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Map generation failed:', err)
    return placeholderDataUrl('map', worldName)
  }
}

export async function generateNpcPortrait(
  npc: { name: string; title: string; appearance: string; gender: string }
): Promise<string> {
  // ── R2 우선 조회 ──────────────────────────────────────────────
  const r2Url = getR2NpcUrl(npc.name, 'portrait')
  if (r2Url) {
    console.log(`[Image/R2] Portrait: ${npc.name} → ${r2Url}`)
    return r2Url
  }

  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('portrait', `${npc.title}\n${npc.name}`)
  }

  try {
    fal.config({ credentials: falKey })
    const genderWord = npc.gender === '여성' ? 'female' : 'male'
    const prompt = `${SDXL_PREFIX}full body character portrait, fantasy RPG character art, ${genderWord}, ${npc.appearance}, ${npc.title}, standing pose, detailed fantasy outfit, consistent character design, clean gradient background, visual novel character art style`

    console.log(`[Image/Portrait] ─────────────────────────────────────────`)
    console.log(`[Image/Portrait] NPC: ${npc.name} | PROMPT: ${prompt}`)
    console.log(`[Image/Portrait] ─────────────────────────────────────────`)

    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 7.0,
        scheduler: "Euler a",
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('portrait', npc.name)
    const safeName = npc.name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
    return downloadToLocal(cdnUrl, 'npcs', `${safeName}-portrait-${shortHash()}`)
  } catch (err) {
    console.error(`[Image] Portrait failed for ${npc.name}:`, err)
    return placeholderDataUrl('portrait', npc.name)
  }
}

export async function generateNpcEmotion(
  npc: { name: string; appearance: string; gender: string },
  emotion: string,
  emotionDescription: string,
  falKeyOverride?: string
): Promise<string> {
  // ── R2 우선 조회 ──────────────────────────────────────────────
  const scene = EMOTION_TO_SCENE[emotion] ?? 'talk'
  const r2Url = getR2NpcUrl(npc.name, scene)
  if (r2Url) {
    console.log(`[Image/R2] Emotion(${emotion}→${scene}): ${npc.name} → ${r2Url}`)
    return r2Url
  }

  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('portrait', `${npc.name}\n(${emotion})`)
  }

  try {
    fal.config({ credentials: falKey })
    const emotionMap: Record<string, string> = {
      neutral: 'neutral calm expression',
      happy: 'smiling happy joyful expression',
      angry: 'angry furious expression',
      sad: 'sad melancholy expression',
      surprised: 'surprised shocked expression',
      serious: 'serious determined expression',
      smug: 'smug confident smiling expression',
    }

    const genderWord = npc.gender === '여성' ? 'female' : 'male'
    const prompt = `${SDXL_PREFIX}bust portrait, fantasy character, ${genderWord}, ${npc.appearance}, EXACTLY same character appearance and outfit, ${emotionMap[emotion] ?? emotion}, ${emotionDescription}, centered face, symmetrical facial features, detailed eyes, clean lineart, consistent character design, visual novel character art style, clean background`

    console.log(`[Image/Emotion] ─────────────────────────────────────────`)
    console.log(`[Image/Emotion] NPC: ${npc.name} | emotion: ${emotion} | PROMPT: ${prompt}`)
    console.log(`[Image/Emotion] ─────────────────────────────────────────`)

    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 7.0,
        scheduler: "Euler a",
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('portrait', npc.name)
    const safeName = npc.name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
    return downloadToLocal(cdnUrl, 'npcs', `${safeName}-${emotion}-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Emotion portrait failed:', err)
    return placeholderDataUrl('portrait', npc.name)
  }
}

// ── Camera shot → composition prompt mapping ──────────────────
const SHOT_COMPOSITION: Record<NonNullable<VisualDirection['camera_shot']>, string> = {
  'close-up': 'close-up shot, face and expression details, shallow depth of field, blurred bokeh background',
  'bust-up': 'bust-up portrait shot, focused on upper body and face, slight depth of field',
  'waist-up': 'waist-up shot, character interaction visible, medium shot, detailed torso and face',
  'full-body': 'full body shot, dynamic standing pose, cinematic character showcase',
  'wide': 'wide angle establishing shot, breathtaking environment, character small in frame',
}

// ── Focus type → additional tags ─────────────────────────────
const FOCUS_TAGS: Record<NonNullable<VisualDirection['focus']>, string> = {
  'character': 'character-centric composition, expressive emotions, detailed character design',
  'environment': 'environmental storytelling, rich background detail, atmospheric depth, establishing shot',
  'intimate': 'intimate proximity, emotional tension, warm soft bokeh focus',
  'object': 'object in focus, macro detail, story-telling prop, dramatic lighting on object',
}

// ── Korean location → English environment tags ────────────────
// currentLocation은 한국어 (예: "어두운 주점", "왕궁 내부") → 영어 환경 태그로 매핑
const KOREAN_LOCATION_MAP: Array<[string, string]> = [
  // 실내 건물
  ['주점', 'tavern'], ['선술집', 'tavern'], ['술집', 'tavern'],
  ['여관', 'inn'], ['숙소', 'inn'], ['숙박', 'inn'],
  ['성', 'castle'], ['왕궁', 'castle'], ['궁전', 'castle'], ['요새', 'castle'],
  ['던전', 'dungeon'], ['지하', 'dungeon'], ['감옥', 'dungeon'], ['지하실', 'dungeon'],
  ['사원', 'temple'], ['신전', 'temple'], ['교회', 'temple'], ['성당', 'temple'],
  ['시장', 'market'], ['상점', 'market'], ['상가', 'market'], ['가게', 'market'],
  ['도시', 'city'], ['도심', 'city'], ['수도', 'city'],
  ['마을', 'village'], ['촌', 'village'], ['마을 광장', 'village'],
  ['항구', 'port'], ['부두', 'port'], ['선착장', 'port'],
  ['학원', 'castle'], ['훈련장', 'castle'], ['병영', 'castle'],
  // 자연/실외
  ['숲', 'forest'], ['삼림', 'forest'], ['나무', 'forest'], ['수풀', 'forest'],
  ['산', 'mountain'], ['절벽', 'mountain'], ['고원', 'mountain'], ['봉우리', 'mountain'],
  ['동굴', 'cave'], ['굴', 'cave'], ['석굴', 'cave'],
  ['폐허', 'ruins'], ['유적', 'ruins'], ['폐성', 'ruins'], ['무너진', 'ruins'],
  ['길', 'road'], ['도로', 'road'], ['평원', 'road'], ['들판', 'road'],
]

// ── Location keyword → detailed environment visual tags ───────
const LOCATION_TAGS: Record<string, string> = {
  'tavern': 'warm tavern interior, wooden beams, stone fireplace, barrels and mugs, candlelit atmosphere',
  'inn': 'cozy inn interior, warm candlelight, wooden furniture, hearth fire, intimate setting',
  'forest': 'ancient dense forest, towering trees, mossy ground, dappled light filtering through canopy, rich foliage',
  'dungeon': 'dark stone dungeon, dripping moisture on walls, iron bars, flickering torchlight, oppressive darkness',
  'castle': 'grand medieval castle interior, massive stone walls, tapestries, iron chandeliers, imposing architecture',
  'city': 'medieval city cobblestone street, half-timber buildings, city crowd, merchant district',
  'market': 'busy medieval market square, colorful merchant stalls, crowds of people, wooden signs',
  'mountain': 'rugged mountain landscape, rocky cliffs, alpine winds, sweeping distant peaks, dramatic sky',
  'cave': 'underground cave system, stalactites, glowing crystals, deep mysterious shadows',
  'village': 'small peaceful medieval village, thatched rooftops, dirt paths, rural pastoral scenery',
  'ruins': 'ancient crumbling stone ruins, overgrown vines and moss, mysterious weathered atmosphere',
  'temple': 'stone temple interior, altar with offerings, religious iconography, incense smoke, sacred light',
  'road': 'dirt road through rolling countryside, distant forests, open sky, travel atmosphere',
  'port': 'medieval harbor port, wooden docks, sailing ships, salt sea air, fishermen and nets',
}

function resolveLocationTag(currentLocation?: string): string {
  if (!currentLocation) return ''

  // 1) 한국어 키워드 매핑 (정확도 우선)
  for (const [kor, eng] of KOREAN_LOCATION_MAP) {
    if (currentLocation.includes(kor)) return LOCATION_TAGS[eng] ?? ''
  }
  // 2) 영어 키워드 매핑 (혼용될 경우 대비)
  const lower = currentLocation.toLowerCase()
  for (const [eng, tag] of Object.entries(LOCATION_TAGS)) {
    if (lower.includes(eng)) return tag
  }
  return ''
}

// ── Weather → visual atmospheric tags ────────────────────────
const WEATHER_TAGS: Record<string, string> = {
  '맑음': 'clear blue sky, bright warm golden sunlight, crisp visibility',
  '흐림': 'overcast cloudy sky, diffused soft grey lighting, muted atmosphere',
  '비': 'heavy rain falling, wet glistening cobblestones, dark overcast sky, rainy atmosphere',
  '폭풍': 'violent storm raging, lightning in dark dramatic clouds, howling wind, intense weather',
  '안개': 'thick ethereal fog, soft diffused light through mist, mysterious atmospheric haze',
  '눈': 'snowflakes gently falling, white snow covering ground, winter frost atmosphere',
  '뇌우': 'thunderstorm, dramatic lightning flash illuminating dark sky, heavy downpour',
  '사막열풍': 'swirling sand dust storm, harsh blazing sunlight, shimmering heat haze, desert winds',
}

export async function generateEnhancedSceneImage(
  sceneDescription: string,
  direction?: VisualDirection | null,
  activeNpcs?: NPC[],
  heroAppearance?: string,
  currentLocation?: string,
  weather?: string,
  falKeyOverride?: string,
  imagePrompt?: string        // Rich Claude-authored prompt (preferred when available)
): Promise<string> {
  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) return placeholderDataUrl('scene', sceneDescription.slice(0, 40))

  try {
    fal.config({ credentials: falKey })

    let prompt: string

    if (imagePrompt?.trim()) {
      // ── Use Claude's rich image_prompt directly ──────────────────
      // Claude already wrote a detailed anime illustration prompt — use it as-is.
      prompt = imagePrompt.trim()
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
      console.log(`[Image/FLUX] PROMPT (Claude, ${prompt.length} chars): ${prompt}`)
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
    } else {
      // ── Fallback: assemble prompt from tags ──────────────────────
      let npcAppearance = '';
      if (activeNpcs && activeNpcs.length > 0) {
        const targetNpcs = activeNpcs.slice(0, 2);
        npcAppearance = targetNpcs.map(n => `(${n.appearance}:1.1)`).join(', ');
        const personCount = targetNpcs.length === 1 ? "solo character, portrait framing" : "2 characters maximum, character-focused framing";
        npcAppearance = `${personCount}, ${npcAppearance}`;
      }

      const locationTag = resolveLocationTag(currentLocation)
      const weatherTag = weather ? (WEATHER_TAGS[weather] ?? '') : ''
      const composition = direction?.camera_shot
        ? SHOT_COMPOSITION[direction.camera_shot]
        : determineComposition(sceneDescription)
      const focusTags = direction?.focus
        ? FOCUS_TAGS[direction.focus]
        : 'character-centric composition, protagonist clearly visible, face details preserved, cinematic composition'
      const lightingTag = direction?.lighting ? direction.lighting + ' lighting' : 'cinematic atmospheric lighting'

      const fluxPromptParts = [
        FLUX_SCENE_PREFIX,
        sceneDescription ? sceneDescription.slice(0, 200) : '',
        locationTag,
        weatherTag,
        lightingTag,
        composition,
        focusTags,
        heroAppearance ? `protagonist: ${heroAppearance}` : '',
        npcAppearance ? `characters: ${npcAppearance}` : '',
      ].filter(Boolean)

      prompt = fluxPromptParts.join(', ')
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
      console.log(`[Image/FLUX] PROMPT (Fallback): ${prompt}`)
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
    }

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,  // FLUX Schnell optimal: 4 steps (~2-4s)
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('scene', sceneDescription.slice(0, 40))
    return downloadToLocal(cdnUrl, 'scenes', `scene-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Enhanced scene generation failed:', err)
    return placeholderDataUrl('scene', sceneDescription.slice(0, 40))
  }
}


// ── Backward-compat alias (deprecated) ───────────────────────
export async function generateSceneImage(sceneDescription: string): Promise<string> {
  return generateEnhancedSceneImage(sceneDescription, null, [])
}

// ================================================================
// 에테르노바 전용 맵 이미지 생성 — 상세 프롬프트 직접 사용
// ================================================================
export async function generateMapImageWithPrompt(
  fullPrompt: string,
  falKeyOverride?: string
): Promise<string> {
  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('map', 'Aeternova')
  }

  try {
    fal.config({ credentials: falKey })
    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt: `${SDXL_PREFIX}${fullPrompt}`,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 32,
        guidance_scale: 7.5,
        scheduler: 'Euler a',
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('map', 'Aeternova')
    return downloadToLocal(cdnUrl, 'map', `aeternova-map-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Aeternova map generation failed:', err)
    return placeholderDataUrl('map', 'Aeternova')
  }
}
