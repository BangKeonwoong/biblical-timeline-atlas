# Biblical Timeline Archive

16개 대시대와 40개 앵커 사건을 기준으로 구성한 성경 타임라인 스크롤 사이트입니다.

## Scripts

- `npm install`
- `npm run generate:data`
- `npm run dev`
- `npm run build`

## Data Sources

- `NKRV` 한국어 본문
- `BHS` 히브리어 구약 본문
- `sblgnt` 헬라어 신약 본문
- 로컬 Obsidian Vault의 원천 마크다운 데이터

## Notes

- 배포용 사이트는 `src/data/generated/site-data.json`을 사용합니다.
- 외부 Vault 경로에서 데이터를 다시 생성하려면 `npm run generate:data`를 실행합니다.
