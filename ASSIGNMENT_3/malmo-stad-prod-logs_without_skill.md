```text
10:07:33.845Z arn1 GET / hn9gp-1792750048948-2502528d578d
{"ts":"2026-10-23T10:07:33.830Z","level":"info","event":"events.loaded","durationMs":3101,"events":507,"duplicates":4,"ok":5,"failed":0,"pending":6,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3001},"malmo-live":{"state":"ok","count":126,"ms":722,"cache":"miss","ageS":2},"slagthuset":{"state":"ok","count":69,"ms":365,"cache":"hit","ageS":2288},"moriska":{"state":"pending","count":0,"ms":3000},"malmo-opera":{"state":"ok","count":238,"ms":282,"cache":"hit","ageS":2269},"malmo-stadsteater":{"state":"pending","count":0,"ms":3000},"inkonst":{"state":"pending","count":0,"ms":3000},"malmo-konsthall":{"state":"pending","count":0,"ms":3000},"skanes-dansteater":{"state":"ok","count":68,"ms":323,"cache":"hit","ageS":2281},"plan-b":{"state":"ok","count":10,"ms":664,"cache":"miss","ageS":2},"tickster-malmo":{"state":"pending","count":0,"ms":3000}}}

10:07:41.879Z arn1 GET / hn9gp-1792750048948-2502528d578d
{"ts":"2026-10-23T10:07:41.879Z","level":"warn","event":"http.failed","source":"malmo-stad","url":"https://malmo.se/evenemang?startDate=2026-10-23&endDate=2027-01-21&num=1000","reason":"network","durationMs":10852,"error":"[malmo-stad] fetch failed"}

10:07:41.880Z arn1 GET / hn9gp-1792750048948-2502528d578d
{"ts":"2026-10-23T10:07:41.879Z","level":"warn","event":"source.fetch_failed","source":"malmo-stad","reason":"network","durationMs":10853,"error":"[malmo-stad] fetch failed"}

10:20:42.284Z arn1 GET / qsklp-1792750837678-0ec2d61d799f
{"ts":"2026-10-23T10:20:42.283Z","level":"info","event":"events.loaded","durationMs":3019,"events":987,"duplicates":47,"ok":10,"failed":0,"pending":1,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3001},"malmo-live":{"state":"ok","count":126,"ms":305,"cache":"hit","ageS":791},"slagthuset":{"state":"ok","count":69,"ms":320,"cache":"hit","ageS":3076},"moriska":{"state":"ok","count":60,"ms":322,"cache":"hit","ageS":781},"malmo-opera":{"state":"ok","count":238,"ms":340,"cache":"hit","ageS":3058},"malmo-stadsteater":{"state":"ok","count":120,"ms":361,"cache":"hit","ageS":788},"inkonst":{"state":"ok","count":29,"ms":280,"cache":"hit","ageS":786},"malmo-konsthall":{"state":"ok","count":27,"ms":298,"cache":"hit","ageS":788},"skanes-dansteater":{"state":"ok","count":68,"ms":302,"cache":"hit","ageS":3069},"plan-b":{"state":"ok","count":10,"ms":242,"cache":"hit","ageS":791},"tickster-malmo":{"state":"ok","count":287,"ms":262,"cache":"hit","ageS":769}}}

10:20:47.783Z arn1 GET / qxxp9-1792750844392-82f4d99e6360
{"ts":"2026-10-23T10:20:47.783Z","level":"info","event":"events.loaded","durationMs":3008,"events":987,"duplicates":47,"ok":10,"failed":0,"pending":1,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3001},"malmo-live":{"state":"ok","count":126,"ms":78,"cache":"hit","ageS":796},"slagthuset":{"state":"ok","count":69,"ms":63,"cache":"hit","ageS":3082},"moriska":{"state":"ok","count":60,"ms":65,"cache":"hit","ageS":787},"malmo-opera":{"state":"ok","count":238,"ms":60,"cache":"hit","ageS":3063},"malmo-stadsteater":{"state":"ok","count":120,"ms":86,"cache":"hit","ageS":793},"inkonst":{"state":"ok","count":29,"ms":66,"cache":"hit","ageS":792},"malmo-konsthall":{"state":"ok","count":27,"ms":63,"cache":"hit","ageS":794},"skanes-dansteater":{"state":"ok","count":68,"ms":81,"cache":"hit","ageS":3075},"plan-b":{"state":"ok","count":10,"ms":88,"cache":"hit","ageS":796},"tickster-malmo":{"state":"ok","count":287,"ms":102,"cache":"hit","ageS":774}}}

10:20:49.849Z arn1 GET / qsklp-1792750837678-0ec2d61d799f
{"ts":"2026-10-23T10:20:49.849Z","level":"warn","event":"http.failed","source":"malmo-stad","url":"https://malmo.se/evenemang?startDate=2026-10-23&endDate=2027-01-21&num=1000","reason":"network","durationMs":10344,"error":"[malmo-stad] fetch failed"}

10:20:49.849Z arn1 GET / qsklp-1792750837678-0ec2d61d799f
{"ts":"2026-10-23T10:20:49.849Z","level":"warn","event":"source.fetch_failed","source":"malmo-stad","reason":"network","durationMs":10345,"error":"[malmo-stad] fetch failed"}

10:20:49.850Z arn1 GET /admin 8gwl5-1792750845485-89ac8ce28a25
{"ts":"2026-10-23T10:20:49.850Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":3968,"error":"[malmo-stad] fetch failed"}

10:20:49.850Z arn1 GET /venues wdm47-1792750846802-90da27136788
{"ts":"2026-10-23T10:20:49.850Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":2676,"error":"[malmo-stad] fetch failed"}

10:20:49.856Z arn1 GET /admin 8gwl5-1792750845485-89ac8ce28a25
{"ts":"2026-10-23T10:20:49.856Z","level":"info","event":"events.loaded","durationMs":3975,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"error","count":0,"ms":3968},"malmo-live":{"state":"ok","count":126,"ms":22,"cache":"hit","ageS":798},"slagthuset":{"state":"ok","count":69,"ms":18,"cache":"hit","ageS":3084},"moriska":{"state":"ok","count":60,"ms":16,"cache":"hit","ageS":789},"malmo-opera":{"state":"ok","count":238,"ms":41,"cache":"hit","ageS":3065},"malmo-stadsteater":{"state":"ok","count":120,"ms":36,"cache":"hit","ageS":795},"inkonst":{"state":"ok","count":29,"ms":19,"cache":"hit","ageS":794},"malmo-konsthall":{"state":"ok","count":27,"ms":37,"cache":"hit","ageS":796},"skanes-dansteater":{"state":"ok","count":68,"ms":14,"cache":"hit","ageS":3077},"plan-b":{"state":"ok","count":10,"ms":42,"cache":"hit","ageS":798},"tickster-malmo":{"state":"ok","count":287,"ms":55,"cache":"hit","ageS":776}}}

10:20:49.864Z arn1 GET /venues wdm47-1792750846802-90da27136788
{"ts":"2026-10-23T10:20:49.863Z","level":"info","event":"events.loaded","durationMs":2690,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"error","count":0,"ms":2676},"malmo-live":{"state":"ok","count":126,"ms":40,"cache":"hit","ageS":798},"slagthuset":{"state":"ok","count":69,"ms":8,"cache":"hit","ageS":3084},"moriska":{"state":"ok","count":60,"ms":21,"cache":"hit","ageS":789},"malmo-opera":{"state":"ok","count":238,"ms":67,"cache":"hit","ageS":3065},"malmo-stadsteater":{"state":"ok","count":120,"ms":27,"cache":"hit","ageS":795},"inkonst":{"state":"ok","count":29,"ms":11,"cache":"hit","ageS":794},"malmo-konsthall":{"state":"ok","count":27,"ms":10,"cache":"hit","ageS":796},"skanes-dansteater":{"state":"ok","count":68,"ms":28,"cache":"hit","ageS":3077},"plan-b":{"state":"ok","count":10,"ms":41,"cache":"hit","ageS":798},"tickster-malmo":{"state":"ok","count":287,"ms":63,"cache":"hit","ageS":776}}}

10:20:51.595Z arn1 GET /venues pbg78-1792750851461-44de1f39ae68
{"ts":"2026-10-23T10:20:51.595Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":44,"error":"[malmo-stad] fetch failed"}

10:20:51.694Z arn1 GET /venues pbg78-1792750851461-44de1f39ae68
{"ts":"2026-10-23T10:20:51.661Z","level":"info","event":"events.loaded","durationMs":111,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"malmo-stadsteater","sources":{"malmo-stad":{"state":"error","count":0,"ms":44},"malmo-live":{"state":"ok","count":126,"ms":71,"cache":"hit","ageS":800},"slagthuset":{"state":"ok","count":69,"ms":64,"cache":"hit","ageS":3086},"moriska":{"state":"ok","count":60,"ms":66,"cache":"hit","ageS":791},"malmo-opera":{"state":"ok","count":238,"ms":75,"cache":"hit","ageS":3067},"malmo-stadsteater":{"state":"ok","count":120,"ms":103,"cache":"hit","ageS":797},"inkonst":{"state":"ok","count":29,"ms":67,"cache":"hit","ageS":796},"malmo-konsthall":{"state":"ok","count":27,"ms":68,"cache":"hit","ageS":798},"skanes-dansteater":{"state":"ok","count":68,"ms":76,"cache":"hit","ageS":3079},"plan-b":{"state":"ok","count":10,"ms":53,"cache":"hit","ageS":800},"tickster-malmo":{"state":"ok","count":287,"ms":86,"cache":"hit","ageS":778}}}

10:20:52.753Z arn1 GET / rb9x4-1792750851461-72d935fa794c
{"ts":"2026-10-23T10:20:52.746Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":100,"error":"[malmo-stad] fetch failed"}

10:20:52.868Z arn1 GET / rb9x4-1792750851461-72d935fa794c
{"ts":"2026-10-23T10:20:52.867Z","level":"info","event":"events.loaded","durationMs":229,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"malmo-stadsteater","sources":{"malmo-stad":{"state":"error","count":0,"ms":100},"malmo-live":{"state":"ok","count":126,"ms":157,"cache":"hit","ageS":801},"slagthuset":{"state":"ok","count":69,"ms":169,"cache":"hit","ageS":3087},"moriska":{"state":"ok","count":60,"ms":171,"cache":"hit","ageS":792},"malmo-opera":{"state":"ok","count":238,"ms":190,"cache":"hit","ageS":3068},"malmo-stadsteater":{"state":"ok","count":120,"ms":196,"cache":"hit","ageS":798},"inkonst":{"state":"ok","count":29,"ms":117,"cache":"hit","ageS":797},"malmo-konsthall":{"state":"ok","count":27,"ms":128,"cache":"hit","ageS":799},"skanes-dansteater":{"state":"ok","count":68,"ms":151,"cache":"hit","ageS":3080},"plan-b":{"state":"ok","count":10,"ms":116,"cache":"hit","ageS":801},"tickster-malmo":{"state":"ok","count":287,"ms":133,"cache":"hit","ageS":779}}}

10:21:37.982Z arn1 GET /venues tnp6r-1792750897388-9b06b97498f3
{"ts":"2026-10-23T10:21:37.981Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":122,"error":"[malmo-stad] fetch failed"}

10:21:38.175Z arn1 GET /venues tnp6r-1792750897388-9b06b97498f3
{"ts":"2026-10-23T10:21:38.174Z","level":"info","event":"events.loaded","durationMs":319,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"tickster-malmo","sources":{"malmo-stad":{"state":"error","count":0,"ms":122},"malmo-live":{"state":"ok","count":126,"ms":197,"cache":"hit","ageS":847},"slagthuset":{"state":"ok","count":69,"ms":199,"cache":"hit","ageS":3132},"moriska":{"state":"ok","count":60,"ms":214,"cache":"hit","ageS":837},"malmo-opera":{"state":"ok","count":238,"ms":238,"cache":"hit","ageS":3114},"malmo-stadsteater":{"state":"ok","count":120,"ms":257,"cache":"hit","ageS":843},"inkonst":{"state":"ok","count":29,"ms":157,"cache":"hit","ageS":842},"malmo-konsthall":{"state":"ok","count":27,"ms":159,"cache":"hit","ageS":844},"skanes-dansteater":{"state":"ok","count":68,"ms":272,"cache":"hit","ageS":3125},"plan-b":{"state":"ok","count":10,"ms":173,"cache":"hit","ageS":847},"tickster-malmo":{"state":"ok","count":287,"ms":295,"cache":"hit","ageS":825}}}

10:21:38.585Z arn1 GET /admin zfzzp-1792750898367-2c63f5beb4ce
{"ts":"2026-10-23T10:21:38.584Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":8,"error":"[malmo-stad] fetch failed"}

10:21:38.643Z arn1 GET /admin zfzzp-1792750898367-2c63f5beb4ce
{"ts":"2026-10-23T10:21:38.642Z","level":"info","event":"events.loaded","durationMs":68,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"tickster-malmo","sources":{"malmo-stad":{"state":"error","count":0,"ms":8},"malmo-live":{"state":"ok","count":126,"ms":22,"cache":"hit","ageS":847},"slagthuset":{"state":"ok","count":69,"ms":18,"cache":"hit","ageS":3133},"moriska":{"state":"ok","count":60,"ms":19,"cache":"hit","ageS":838},"malmo-opera":{"state":"ok","count":238,"ms":56,"cache":"hit","ageS":3114},"malmo-stadsteater":{"state":"ok","count":120,"ms":26,"cache":"hit","ageS":844},"inkonst":{"state":"ok","count":29,"ms":16,"cache":"hit","ageS":843},"malmo-konsthall":{"state":"ok","count":27,"ms":10,"cache":"hit","ageS":845},"skanes-dansteater":{"state":"ok","count":68,"ms":37,"cache":"hit","ageS":3126},"plan-b":{"state":"ok","count":10,"ms":11,"cache":"hit","ageS":847},"tickster-malmo":{"state":"ok","count":287,"ms":61,"cache":"hit","ageS":825}}}

10:25:01.245Z dub1 GET / ws2gs-1792751100103-fd5d718e6c43
{"ts":"2026-10-23T10:25:01.244Z","level":"warn","event":"http.failed","source":"malmo-stad","url":"https://malmo.se/evenemang?startDate=2026-10-23&endDate=2027-01-21&num=1000","reason":"timeout","durationMs":203267,"error":"[malmo-stad] No response from malmo.se within 15000 ms"}

10:25:01.245Z dub1 GET / ws2gs-1792751100103-fd5d718e6c43
{"ts":"2026-10-23T10:25:01.244Z","level":"warn","event":"source.fetch_failed","source":"malmo-stad","reason":"timeout","durationMs":203267,"error":"[malmo-stad] No response from malmo.se within 15000 ms"}

10:25:04.445Z dub1 GET / ws2gs-1792751100103-fd5d718e6c43
{"ts":"2026-10-23T10:25:04.444Z","level":"info","event":"events.loaded","durationMs":3084,"events":987,"duplicates":47,"ok":10,"failed":0,"pending":1,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3001},"malmo-live":{"state":"ok","count":126,"ms":104,"cache":"hit","ageS":1053},"slagthuset":{"state":"ok","count":69,"ms":115,"cache":"hit","ageS":3339},"moriska":{"state":"ok","count":60,"ms":105,"cache":"hit","ageS":1043},"malmo-opera":{"state":"ok","count":238,"ms":119,"cache":"hit","ageS":3320},"malmo-stadsteater":{"state":"ok","count":120,"ms":136,"cache":"hit","ageS":1050},"inkonst":{"state":"ok","count":29,"ms":95,"cache":"hit","ageS":1049},"malmo-konsthall":{"state":"ok","count":27,"ms":95,"cache":"hit","ageS":1050},"skanes-dansteater":{"state":"ok","count":68,"ms":137,"cache":"hit","ageS":3331},"plan-b":{"state":"ok","count":10,"ms":81,"cache":"hit","ageS":1053},"tickster-malmo":{"state":"ok","count":287,"ms":158,"cache":"hit","ageS":1031}}}

10:25:05.516Z dub1 GET / lm9zw-1792751101377-15230e1c1d6f
{"ts":"2026-10-23T10:25:05.515Z","level":"info","event":"events.loaded","durationMs":3006,"events":987,"duplicates":47,"ok":10,"failed":0,"pending":1,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3000},"malmo-live":{"state":"ok","count":126,"ms":69,"cache":"hit","ageS":1054},"slagthuset":{"state":"ok","count":69,"ms":70,"cache":"hit","ageS":3340},"moriska":{"state":"ok","count":60,"ms":71,"cache":"hit","ageS":1044},"malmo-opera":{"state":"ok","count":238,"ms":85,"cache":"hit","ageS":3321},"malmo-stadsteater":{"state":"ok","count":120,"ms":101,"cache":"hit","ageS":1051},"inkonst":{"state":"ok","count":29,"ms":64,"cache":"hit","ageS":1050},"malmo-konsthall":{"state":"ok","count":27,"ms":65,"cache":"hit","ageS":1051},"skanes-dansteater":{"state":"ok","count":68,"ms":73,"cache":"hit","ageS":3332},"plan-b":{"state":"ok","count":10,"ms":62,"cache":"hit","ageS":1054},"tickster-malmo":{"state":"ok","count":287,"ms":106,"cache":"hit","ageS":1032}}}

10:25:11.723Z dub1 GET / ws2gs-1792751100103-fd5d718e6c43
{"ts":"2026-10-23T10:25:11.723Z","level":"warn","event":"http.failed","source":"malmo-stad","url":"https://malmo.se/evenemang?startDate=2026-10-23&endDate=2027-01-21&num=1000","reason":"network","durationMs":10127,"error":"[malmo-stad] fetch failed"}

10:25:11.723Z dub1 GET / ws2gs-1792751100103-fd5d718e6c43
{"ts":"2026-10-23T10:25:11.723Z","level":"warn","event":"source.fetch_failed","source":"malmo-stad","reason":"network","durationMs":10127,"error":"[malmo-stad] fetch failed"}

10:26:12.594Z arn1 GET / 7lgl6-1792751172490-66f2c6af1dd8
VercelRemoteCacheHandler: Failed to set ["c03490fe897e9d6d715f0bcb60909960196c45aaf3",["malmo-stad"],["7hbdfUsPbgc2VHs-D06Xv"]] in remote cache [TypeError: fetch failed] {
  [cause]: Error [SocketError]: other side closed
      at ignore-listed frames {
    code: 'UND_ERR_SOCKET',
    socket: {
      localAddress: '169.254.100.6',
      localPort: 55140,
      remoteAddress: '184.196.242.252',
      remotePort: 443,
      remoteFamily: 'IPv4',
      timeout: undefined,
      bytesWritten: 1574,
      bytesRead: 0
    }
  }
}

10:26:15.618Z arn1 GET / 7lgl6-1792751172490-66f2c6af1dd8
{"ts":"2026-10-23T10:26:15.618Z","level":"info","event":"events.loaded","durationMs":3006,"events":987,"duplicates":47,"ok":10,"failed":0,"pending":1,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3000},"malmo-live":{"state":"ok","count":126,"ms":228,"cache":"hit","ageS":1124},"slagthuset":{"state":"ok","count":69,"ms":182,"cache":"hit","ageS":3410},"moriska":{"state":"ok","count":60,"ms":185,"cache":"hit","ageS":1115},"malmo-opera":{"state":"ok","count":238,"ms":202,"cache":"hit","ageS":3391},"malmo-stadsteater":{"state":"ok","count":120,"ms":209,"cache":"hit","ageS":1121},"inkonst":{"state":"ok","count":29,"ms":219,"cache":"hit","ageS":1120},"malmo-konsthall":{"state":"ok","count":27,"ms":220,"cache":"hit","ageS":1122},"skanes-dansteater":{"state":"ok","count":68,"ms":224,"cache":"hit","ageS":3403},"plan-b":{"state":"ok","count":10,"ms":225,"cache":"hit","ageS":1124},"tickster-malmo":{"state":"ok","count":287,"ms":241,"cache":"hit","ageS":1102}}}

10:26:20.741Z arn1 GET / 2g7n6-1792751177661-7ac3d4db3662
{"ts":"2026-10-23T10:26:20.741Z","level":"info","event":"events.loaded","durationMs":3007,"events":987,"duplicates":47,"ok":10,"failed":0,"pending":1,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3000},"malmo-live":{"state":"ok","count":126,"ms":83,"cache":"hit","ageS":1129},"slagthuset":{"state":"ok","count":69,"ms":64,"cache":"hit","ageS":3415},"moriska":{"state":"ok","count":60,"ms":65,"cache":"hit","ageS":1120},"malmo-opera":{"state":"ok","count":238,"ms":80,"cache":"hit","ageS":3396},"malmo-stadsteater":{"state":"ok","count":120,"ms":76,"cache":"hit","ageS":1126},"inkonst":{"state":"ok","count":29,"ms":60,"cache":"hit","ageS":1125},"malmo-konsthall":{"state":"ok","count":27,"ms":58,"cache":"hit","ageS":1127},"skanes-dansteater":{"state":"ok","count":68,"ms":97,"cache":"hit","ageS":3408},"plan-b":{"state":"ok","count":10,"ms":61,"cache":"hit","ageS":1129},"tickster-malmo":{"state":"ok","count":287,"ms":103,"cache":"hit","ageS":1107}}}

10:26:23.068Z arn1 GET / 7lgl6-1792751172490-66f2c6af1dd8
{"ts":"2026-10-23T10:26:23.067Z","level":"warn","event":"http.failed","source":"malmo-stad","url":"https://malmo.se/evenemang?startDate=2026-10-23&endDate=2027-01-21&num=1000","reason":"network","durationMs":10293,"error":"[malmo-stad] fetch failed"}

10:26:23.068Z arn1 GET / 7lgl6-1792751172490-66f2c6af1dd8
{"ts":"2026-10-23T10:26:23.068Z","level":"warn","event":"source.fetch_failed","source":"malmo-stad","reason":"network","durationMs":10293,"error":"[malmo-stad] fetch failed"}

10:26:23.069Z arn1 GET /admin 49fzr-1792751179453-4b8eac3edc69
{"ts":"2026-10-23T10:26:23.068Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":3542,"error":"[malmo-stad] fetch failed"}

10:26:23.075Z arn1 GET /admin 49fzr-1792751179453-4b8eac3edc69
{"ts":"2026-10-23T10:26:23.074Z","level":"info","event":"events.loaded","durationMs":3549,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"error","count":0,"ms":3542},"malmo-live":{"state":"ok","count":126,"ms":10,"cache":"hit","ageS":1132},"slagthuset":{"state":"ok","count":69,"ms":7,"cache":"hit","ageS":3417},"moriska":{"state":"ok","count":60,"ms":25,"cache":"hit","ageS":1122},"malmo-opera":{"state":"ok","count":238,"ms":35,"cache":"hit","ageS":3399},"malmo-stadsteater":{"state":"ok","count":120,"ms":46,"cache":"hit","ageS":1128},"inkonst":{"state":"ok","count":29,"ms":15,"cache":"hit","ageS":1127},"malmo-konsthall":{"state":"ok","count":27,"ms":12,"cache":"hit","ageS":1129},"skanes-dansteater":{"state":"ok","count":68,"ms":14,"cache":"hit","ageS":3410},"plan-b":{"state":"ok","count":10,"ms":11,"cache":"hit","ageS":1132},"tickster-malmo":{"state":"ok","count":287,"ms":30,"cache":"hit","ageS":1110}}}

10:26:33.561Z arn1 POST /admin 5j255-1792751193295-9ae8384800f1
{"ts":"2026-10-23T10:26:33.561Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":41,"error":"[malmo-stad] fetch failed"}

10:26:37.582Z arn1 POST /admin 5j255-1792751193295-9ae8384800f1
{"ts":"2026-10-23T10:26:37.581Z","level":"info","event":"events.loaded","durationMs":4064,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"malmo-stadsteater","sources":{"malmo-stad":{"state":"error","count":0,"ms":41},"malmo-live":{"state":"ok","count":126,"ms":92,"cache":"hit","ageS":1146},"slagthuset":{"state":"ok","count":69,"ms":81,"cache":"hit","ageS":3432},"moriska":{"state":"ok","count":60,"ms":113,"cache":"hit","ageS":1136},"malmo-opera":{"state":"ok","count":238,"ms":111,"cache":"hit","ageS":3413},"malmo-stadsteater":{"state":"ok","count":120,"ms":4055,"cache":"miss","ageS":0},"inkonst":{"state":"ok","count":29,"ms":99,"cache":"hit","ageS":1142},"malmo-konsthall":{"state":"ok","count":27,"ms":78,"cache":"hit","ageS":1143},"skanes-dansteater":{"state":"ok","count":68,"ms":98,"cache":"hit","ageS":3425},"plan-b":{"state":"ok","count":10,"ms":75,"cache":"hit","ageS":1146},"tickster-malmo":{"state":"ok","count":287,"ms":97,"cache":"hit","ageS":1124}}}

10:27:38.843Z arn1 GET /venues shwlf-1792751258751-d9750ab136cb
{"ts":"2026-10-23T10:27:38.842Z","level":"warn","event":"http.failed","source":"malmo-stad","url":"https://malmo.se/evenemang?startDate=2026-10-23&endDate=2027-01-21&num=1000","reason":"timeout","durationMs":65284,"error":"[malmo-stad] No response from malmo.se within 15000 ms"}

10:27:38.843Z arn1 GET /venues shwlf-1792751258751-d9750ab136cb
{"ts":"2026-10-23T10:27:38.843Z","level":"warn","event":"source.fetch_failed","source":"malmo-stad","reason":"timeout","durationMs":65284,"error":"[malmo-stad] No response from malmo.se within 15000 ms"}

10:27:41.917Z arn1 GET /venues shwlf-1792751258751-d9750ab136cb
{"ts":"2026-10-23T10:27:41.916Z","level":"info","event":"events.loaded","durationMs":3044,"events":987,"duplicates":47,"ok":10,"failed":0,"pending":1,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"pending","count":0,"ms":3001},"malmo-live":{"state":"ok","count":126,"ms":147,"cache":"hit","ageS":1210},"slagthuset":{"state":"ok","count":69,"ms":149,"cache":"hit","ageS":3496},"moriska":{"state":"ok","count":60,"ms":151,"cache":"hit","ageS":1201},"malmo-opera":{"state":"ok","count":238,"ms":166,"cache":"hit","ageS":3477},"malmo-stadsteater":{"state":"ok","count":120,"ms":159,"cache":"hit","ageS":64},"inkonst":{"state":"ok","count":29,"ms":163,"cache":"hit","ageS":1206},"malmo-konsthall":{"state":"ok","count":27,"ms":142,"cache":"hit","ageS":1208},"skanes-dansteater":{"state":"ok","count":68,"ms":179,"cache":"hit","ageS":3489},"plan-b":{"state":"ok","count":10,"ms":143,"cache":"hit","ageS":1210},"tickster-malmo":{"state":"ok","count":287,"ms":183,"cache":"hit","ageS":1188}}}

10:27:49.324Z arn1 GET /venues shwlf-1792751258751-d9750ab136cb
{"ts":"2026-10-23T10:27:49.324Z","level":"warn","event":"http.failed","source":"malmo-stad","url":"https://malmo.se/evenemang?startDate=2026-10-23&endDate=2027-01-21&num=1000","reason":"network","durationMs":10214,"error":"[malmo-stad] fetch failed"}

10:27:49.324Z arn1 GET /venues shwlf-1792751258751-d9750ab136cb
{"ts":"2026-10-23T10:27:49.324Z","level":"warn","event":"source.fetch_failed","source":"malmo-stad","reason":"network","durationMs":10214,"error":"[malmo-stad] fetch failed"}

10:27:49.325Z arn1 GET /admin 668nl-1792751260026-ec939898eacd
{"ts":"2026-10-23T10:27:49.325Z","level":"warn","event":"source.unavailable","source":"malmo-stad","durationMs":9225,"error":"[malmo-stad] fetch failed"}

10:27:49.333Z arn1 GET /admin 668nl-1792751260026-ec939898eacd
{"ts":"2026-10-23T10:27:49.332Z","level":"info","event":"events.loaded","durationMs":9233,"events":987,"duplicates":47,"ok":10,"failed":1,"pending":0,"disabled":2,"slowest":"malmo-stad","sources":{"malmo-stad":{"state":"error","count":0,"ms":9225},"malmo-live":{"state":"ok","count":126,"ms":40,"cache":"hit","ageS":1218},"slagthuset":{"state":"ok","count":69,"ms":17,"cache":"hit","ageS":3503},"moriska":{"state":"ok","count":60,"ms":14,"cache":"hit","ageS":1208},"malmo-opera":{"state":"ok","count":238,"ms":52,"cache":"hit","ageS":3485},"malmo-stadsteater":{"state":"ok","count":120,"ms":35,"cache":"hit","ageS":72},"inkonst":{"state":"ok","count":29,"ms":11,"cache":"hit","ageS":1213},"malmo-konsthall":{"state":"ok","count":27,"ms":13,"cache":"hit","ageS":1215},"skanes-dansteater":{"state":"ok","count":68,"ms":18,"cache":"hit","ageS":3496},"plan-b":{"state":"ok","count":10,"ms":10,"cache":"hit","ageS":1218},"tickster-malmo":{"state":"ok","count":287,"ms":31,"cache":"hit","ageS":1196}}}
```
