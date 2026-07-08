# 탐지 쿼리 (CloudWatch Logs Insights / Athena)

본 분석 환경 구성: CloudTrail은 S3 트레일 버킷으로, VPC Flow Logs는 CloudWatch Logs로 전달된다.
따라서 CloudTrail 계열은 Athena, Flow Logs는 Logs Insights로 조회한다.

## Athena - CloudTrail (S3 트레일 버킷)

먼저 CloudTrail용 Athena 테이블을 만든다(AWS 콘솔의 CloudTrail > "Create Athena table"이 표준
DDL을 생성). 이후:

인스턴스 역할 자격증명의 외부 사용:
```sql
SELECT eventtime, eventname, sourceipaddress, useridentity.arn
FROM cloudtrail_logs
WHERE useridentity.arn LIKE '%assumed-role/cloudir-ec2-role%'
  AND sourceipaddress NOT LIKE '10.%'
  AND sourceipaddress NOT LIKE '%.amazonaws.com'
ORDER BY eventtime;
```

민감 버킷 유출(S3 데이터 이벤트):
```sql
SELECT eventtime, eventname, sourceipaddress,
       json_extract_scalar(requestparameters, '$.bucketName') AS bucket,
       json_extract_scalar(requestparameters, '$.key')        AS key
FROM cloudtrail_logs
WHERE eventsource = 's3.amazonaws.com'
  AND eventname IN ('GetObject', 'ListObjects')
  AND json_extract_scalar(requestparameters, '$.bucketName') LIKE 'cloudir-sensitive%'
ORDER BY eventtime;
```

## CloudWatch Logs Insights - VPC Flow Logs (`/cloudir/vpc-flow-logs`)

외부에서 웹 포트(80)로의 인바운드 상위 소스:
```
fields @timestamp, srcAddr, dstAddr, dstPort, action, bytes
| filter dstPort = 80 and action = "ACCEPT"
| stats count(*) as hits, sum(bytes) as total_bytes by srcAddr
| sort hits desc
```

특정 공격자 IP의 활동(운영자 IP는 마스킹):
```
fields @timestamp, srcAddr, dstAddr, dstPort, action, bytes
| filter srcAddr = "203.0.113.42"
| sort @timestamp asc
```
