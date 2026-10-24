# OpenWeb vs current adapters

Run 2026-10-24T16:24:10.191Z, 5 rounds per side per venue. OpenWeb runs through its CLI;
starting the CLI alone takes about 285 ms, which is included in its times.

## slagthuset

| | Current adapter | OpenWeb |
|---|---|---|
| Success | 5/5 | 5/5 |
| Median time | 627 ms | 879 ms |
| p95 time | 715 ms | 987 ms |
| Events | 68 | 68 |
| Has startTime | 100% | 100% |
| Has endTime | 22% | 22% |
| Has price | 99% | 99% |
| Has description | 100% | 100% |
| Has image | 0% | 0% |
| Has ticketUrl | 100% | 100% |
| Links that load | 5/5 | 5/5 |
| Needs a browser | no | no |

Same events on both sides: 68; only current: 0; only OpenWeb: 0.

## malmo-live

| | Current adapter | OpenWeb |
|---|---|---|
| Success | 5/5 | 5/5 |
| Median time | 175 ms | 581 ms |
| p95 time | 1525 ms | 680 ms |
| Events | 123 | 123 |
| Has startTime | 100% | 100% |
| Has endTime | 0% | 0% |
| Has price | 97% | 97% |
| Has description | 100% | 100% |
| Has image | 100% | 100% |
| Has ticketUrl | 89% | 89% |
| Links that load | 3/5 | 5/5 |
| Needs a browser | no | no |

Same events on both sides: 123; only current: 0; only OpenWeb: 0.

## plan-b

| | Current adapter | OpenWeb |
|---|---|---|
| Success | 5/5 | 5/5 |
| Median time | 119 ms | 655 ms |
| p95 time | 4299 ms | 11165 ms |
| Events | 10 | 65 |
| Has startTime | 0% | 100% |
| Has endTime | 0% | 100% |
| Has price | 0% | 95% |
| Has description | 0% | 100% |
| Has image | 100% | 100% |
| Has ticketUrl | 100% | 100% |
| Links that load | 0/5 | 5/5 |
| Needs a browser | no | no |

Same events on both sides: 10; only current: 0; only OpenWeb: 55.

