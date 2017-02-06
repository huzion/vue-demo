/**
 * Created by machine on 2016/7/13.
 */

/**
 * 媒体查询列表查询
 * @param cityName 地区（城市或省份）
 * @param beginDate 开始日期
 * @param endDate 结束日期
 * @param mediaName 媒体名称（关键字模糊匹配） ，没有则为空字符串
 * @param callback 回调方法
 * 回调方法数据格式：
 * [
 *     {
 *         radioName: "南京音乐频率 FM105.8",  //电台名称
 *         description: "南京音乐广播以当代流行经典为主，兼容新鲜资讯，早晚高峰权威路况等。",  //电台描述
 *         frequency: "FM105.8",  //电台频率
 *         maxDiscount: "4.0",  //最大折扣
 *         total: "100",  //总共的刊例总数
 *         detail: [
 *             {
 *                 timeRangeTxt: "时段"
 *                 timeRangeVal: "00:00-01:00 (0:00)"
 *                 programTxt: "节目",
 *                 programVal: "音乐榜样"
 *                 price5Txt: "5\"价格",
 *                 price5Val: "160.00",  //折后价
 *                 price5OriginalVal: "400.00",  //原价
 *                 price10Txt: "10\"价格",
 *                 price10Val: "270.00",
 *                 price10OriginalVal: "675.00",
 *                 price15Txt: "15\"价格",
 *                 price15Val: "416.00",
 *                 price15OriginalVal: "1040.00",
 *                 price20Txt: "20\"价格",
 *                 price20Val: "520.00",
 *                 price20OriginalVal: "1300.00",
 *                 price30Txt: "30\"价格",
 *                 price30Val: "708.00",
 *                 price30OriginalVal: "1770.00",
 *                 price45Txt: "45\"价格",
 *                 price45Val: "1124.00",
 *                 price45OriginalVal: "2810.00",
 *                 discountTxt: "折扣",
 *                 discountVal: "4.0折"
 *                 statusTxt: "状态",
 *                 statusVal: "热销"
 *             },  //detail row1, 每行的数据
 *             {...},  //detail row2
 *             ...  //detail row N
 *         ]
 *     },  //电台1
 *     {},  //电台2
 *     ...  //电台N
 * ]
 *
 * usage:
 * switchDataFromMediaQuery('南京', '2016/07/04', '2016/08/03', '南京音乐频率 FM105.8', function(data) {
 *     if (!data) {
 *         alert("Can not get any data!")
 *     }
 *     else {
 *         alert(JSON.stringify(data));
 *     }
 * });
 */
function switchDataFromMediaQuery(cityName, beginDate, endDate, mediaName, callback) {
	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'text',
		url: '/queryPeriodication.aspx?cn=' + $.base64.encode(cityName, true) + '&bd=' + $.base64.encode(beginDate, true) + '&ed=' + $.base64.encode(endDate, true) + '&mn=' + $.base64.encode(mediaName, true),
		//data: data,
		dataFilter: function(data, type) {
			return data.replace(/<(?:link|img)\b.*?(\/>|"\s*>)/ig, '').replace(/\r\n|\n/g, '\uffff').replace(/<(script|style)\b.*?<\/\1>/gi, '').replace(/\uffff/g, '\n');
		},
		success: function(data, textStatus, jqXHR) {
			var allRadioData = [];
			$(data).find('#hotelContent>div.onxlg-dt-wrapper>div').each(function() {
				var radioData = {};
				allRadioData.push(radioData);
				var $analytics = $(this);
				radioData['radioName'] = $analytics.find('>div.on-search-result>div.sr-img>p.sr-img-title').text().trim();
				radioData['description'] = $analytics.find('>div.on-search-result>div.sr-miaoshu>p.sr-text').text().trim();
				radioData['frequency'] = $analytics.find('>div.on-search-result>div.sr-miaoshu>p.sr-title').text().trim();
				radioData['maxDiscount'] = $analytics.find('>div.on-search-result>div.sr-zhekou>div.main-content>div.sr95zhe>span.zhenum').text().trim();
				radioData['total'] = $analytics.find('>div.on-search-result>div.sr-zhekou>div.main-content>div.sr-product>p>span').text().trim();
				var txtKeyMap = {
					"节目时段（广告播放时刻）": "timeRange",
					"节目": "program",
					"5\"价格": "price5",
					"10\"价格": "price10",
					"15\"价格": "price15",
					"20\"价格": "price20",
					"30\"价格": "price30",
					"45\"价格": "price45",
					"折扣": "discount",
					"状态": "status"
				};
				var detailTitleList = $analytics.find('>table.onxlg-table>thead>tr>th').toArray().map(function(item, idx) {
					item = $(item).text().trim();
					if (item in txtKeyMap) {
						return [txtKeyMap[item], item];
					}
					return ["unknown" + idx, item];
				});
				radioData['detail'] = $analytics.find('>table.onxlg-table>tbody>tr').toArray().map(function(item) {
					return $('td', item).toArray().reduce(function(prev, item, idx) {
						prev[detailTitleList[idx][0] + "Txt"] = detailTitleList[idx][1];
						if ($(item).hasClass('cx-color')) {
							var originalPrice = $('label', item).text().trim();
							var $tmpItem = $(item).clone();
							$tmpItem.find('label').remove();
							var discountPrice = $tmpItem.text().trim();
							prev[detailTitleList[idx][0] + "Val"] = discountPrice;
							prev[detailTitleList[idx][0] + "OriginalVal"] = originalPrice;
						}
						else {
							prev[detailTitleList[idx][0] + "Val"] = $(item).text().trim();
						}
						return prev;
					}, {});
				});
			});

			callback(allRadioData);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get data from server!');
			callback(null);
		}
	});
}


/**
 * 媒体时间秒数对应的广告位折扣查询查询
 * @param cityName 地区（城市或省份）
 * @param beginDate 开始日期
 * @param endDate 结束日期
 * @param mediaName 媒体名称（精确匹配）
 * @param second 描述
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *     "音乐榜样00:00-01:00 (0:00)": {
 *       "discount": "2.4折",
 *       "originalPrice": "400.00",
 *       "price": "96.00"
 *     },
 *     "音乐榜样00:00-01:00 (0:30)": {
 *       "discount": "2.2折",
 *       "originalPrice": "400.00",
 *       "price": "88.00"
 *     },
 *     "音乐夜未眠01:00-04:00 (1:00)": {
 *       "discount": "1.5折",
 *       "originalPrice": "400.00",
 *       "price": "60.00"
 *     },
 *     { ... },
 *     ...
 * }
 * usage:
 * queryPriceByMedia('南京', '2016/07/04', '2016/08/03', '南京音乐频率 FM105.8', 5, function(data) {
 *     if (!data) {
 *         alert("Can not get any data!")
 *     }
 *     else {
 *         alert(JSON.stringify(data));
 *     }
 * });
 */
function queryPriceByMedia(cityName, beginDate, endDate, mediaName, second, callback) {
	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'text',
		url: '/queryPeriodication.aspx?cn=' + $.base64.encode(cityName, true) + '&bd=' + $.base64.encode(beginDate, true) + '&ed=' + $.base64.encode(endDate, true) + '&mn=' + $.base64.encode(mediaName, true),
		//data: data,
		dataFilter: function(data, type) {
			return data.replace(/<(?:link|img)\b.*?(\/>|"\s*>)/ig, '').replace(/\r\n|\n/g, '\uffff').replace(/<(script|style)\b.*?<\/\1>/gi, '').replace(/\uffff/g, '\n');
		},
		success: function(data, textStatus, jqXHR) {
			console.log(data);
			var allRadioData = [];
			$(data).find('#hotelContent>div.onxlg-dt-wrapper>div').each(function() {
				var radioData = {};
				allRadioData.push(radioData);
				var $analytics = $(this);
				radioData['radioName'] = $analytics.find('>div.on-search-result>div.sr-img>p.sr-img-title').text().trim();
				var txtKeyMap = {
					"节目时段（广告播放时刻）": "timeRange",
					"节目": "program",
					"5\"价格": "price5",
					"10\"价格": "price10",
					"15\"价格": "price15",
					"20\"价格": "price20",
					"30\"价格": "price30",
					"45\"价格": "price45",
					"折扣": "discount",
					"状态": "status"
				};
				var detailTitleList = $analytics.find('>table.onxlg-table>thead>tr>th').toArray().map(function(item, idx) {
					item = $(item).text().trim();
					if (item in txtKeyMap) {
						return [txtKeyMap[item], item];
					}
					return ["unknown" + idx, item];
				});
				radioData['detail'] = $analytics.find('>table.onxlg-table>tbody>tr').toArray().map(function(item) {
					return $('td', item).toArray().reduce(function(prev, item, idx) {
						prev[detailTitleList[idx][0] + "Txt"] = detailTitleList[idx][1];
						if ($(item).hasClass('cx-color')) {
							var originalPrice = $('label', item).text().trim();
							var $tmpItem = $(item).clone();
							$tmpItem.find('label').remove();
							var discountPrice = $tmpItem.text().trim();
							prev[detailTitleList[idx][0] + "Val"] = discountPrice;
							prev[detailTitleList[idx][0] + "OriginalVal"] = originalPrice;
						}
						else {
							prev[detailTitleList[idx][0] + "Val"] = $(item).text().trim();
						}
						return prev;
					}, {});
				});
			});

			var showPriceData = {};
			allRadioData.forEach(function(item) {
				if (item['radioName'] == mediaName) {
					item['detail'].forEach(function(item) {
						var priceKey = 'price' + second + 'Val';
						if (item[priceKey] != null && item[priceKey] != '') {
							var originalPriceKey = 'price' + second + 'OriginalVal';
							showPriceData[item['programVal'] + item['timeRangeVal']] = {
								discount: item['discountVal'],
								originalPrice: item[originalPriceKey],
								price: item[priceKey]
							};
						}
					});
				}
			});

			callback(showPriceData);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get data from server!');
			callback(null);
		}
	});
}




/**
 * 获取行业名和行业id的map
 * @param industryName 行业名称（关键字模糊匹配），没有则为空字符串
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *      "综合": "38",
 *      "商业商场": "39",
 *      "医疗服务": "40",
 *      ...
 * }
 *
 * usage：
 * getIndustryInfoMap("医疗", function(data) {
 *     alert(JSON.stringify(data));
 *     // change to list
 *     alert(JSON.stringify(Object.keys(data).map(function(item) {
 *         return {
 *             id: data[item],
 *             txt: item
 *         }
 *     })));
 * });
 */
function getIndustryInfoMap(industryName, callback) {
	window.industryInfoMap = {};

	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'json',
		url: '/Handlers/CityByMediaHandler.ashx?act=getIndustryList&industryname=' + encodeURIComponent(industryName ? industryName : ''),
		success: function(data, textStatus, jqXHR) {
			if (data["Industry"]) {
				window.industryInfoMap = data["Industry"].reduce(function(obj, item) {
					obj[item["OPA15Name"]] = item["OPA15Id"];
					return obj;
				}, {});
			}
			callback(window.industryInfoMap);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get Industry Info Map data from server!');
			callback(window.industryInfoMap);
		}
	});
}


/**
 * 根据地区获取媒体信息
 * @param cityName 地区（城市或省份）
 * @param mediaName 媒体名称（关键字模糊匹配），没有则为空字符串
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *      "山东交通台 FM101.1": {
 *          "id": "10014",
 *          "name": "山东交通台 FM101.1",
 *          "frequency": "FM101.1",
 *          "description": "山东交通台（山东广播交通频道）是山东唯一的省级交通广播媒体，覆盖全省17市地...",
 *          "city": "山东省"
 *      },
 *      "xxxx台": { ... },
 *      ...
 * }
 *
 * usage：
 * getMediaInfoByCity("江苏", "", function(data) {
 *     alert(JSON.stringify(data));
 *     // change to list
 *     alert(JSON.stringify(Object.keys(data).map(function(item) {
 *         return data[item]
 *     })));
 * });
 */
function getMediaInfoByCity(cityName, mediaName, callback) {
	window.mediaInfoMap = {};

	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'json',
		url: '/Handlers/CityByMediaHandler.ashx?act=getmediaList&city=' + encodeURIComponent(cityName ? cityName : '') + '&mn=' + encodeURIComponent(mediaName ? mediaName : ''),
		success: function(data, textStatus, jqXHR) {
			if (data["Medias"]) {
				window.mediaInfoMap = data["Medias"].reduce(function(obj, item) {
					var radio = {};
					radio["id"] = item["MBR02Id"];
					radio["name"] = item["MBR02Name"];
					radio["frequency"] = item["MBR02Code"];
					radio["description"] = item["MBR02Desc"];
					radio["city"] = item["MBX01Name"];
					obj[radio["name"]] = radio;
					return obj;
				}, {});
			}
			callback(window.mediaInfoMap);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get Media Info Map data from server!');
			callback(window.mediaInfoMap);
		}
	});
}

/**
 * 按照地区划分获取全部媒体信息(市会重复存在于省中，比如深圳电台即会属于深圳市，又会属于广东省)
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *      "山东省": [{
 *              "id": "10014",
 *              "name": "山东交通台 FM101.1",
 *              "city": "山东省",
 *              "cityId": "370000"
 *          },
 *          { ... },
 *          ...
 *      ],
 *      "江苏省": [
 *          { ... },
 *          { ... },
 *      ],
 *      ...
 * }
 *
 * usage：
 * getAllMediaInfo(function(data) {
 *     alert(JSON.stringify(data));
 *     // change to list
 *     alert(JSON.stringify(Object.keys(data).map(function(item) {
 *         return {
 *             provinceName: item,
 *             medias: data[item]
 *         }
 *     })));
 * });
 */
function getAllMediaInfo(callback) {
	window.allMediaInfoCityMap = {};

	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'json',
		url: '/Handlers/CityByMediaHandler.ashx?act=getmediaList&city=&mn=',
		success: function(data, textStatus, jqXHR) {
			if (data["Medias"]) {
				var i, len;
				var medias = data["Medias"];

				var provinceIdNameMap = {};
				var allMediaInfoCityMap = {};
				for (i=0, len=medias.length; i<len; i++) {
					if (!(medias[i]["MBX01Name"] in allMediaInfoCityMap)) {
						allMediaInfoCityMap[medias[i]["MBX01Name"]] = [];
					}

					if (medias[i]["OPA03Desc"] == "省级") {
						provinceIdNameMap[medias[i]["MBR02MBX01Id"].slice(0, 3)] = medias[i]["MBX01Name"];
					}
				}

				for (i=0, len=medias.length; i<len; i++) {
					var radio = {};
					radio["id"] = medias[i]["MBR02Id"];
					radio["name"] = medias[i]["MBR02Name"];
					//radio["frequency"] = medias[i]["MBR02Code"];
					//radio["description"] = medias[i]["MBR02Desc"];
					radio["city"] = medias[i]["MBX01Name"];
					radio["cityId"] = medias[i]["MBR02MBX01Id"];

					allMediaInfoCityMap[radio["city"]].push(radio);
					if (medias[i]["OPA03Desc"] !== "省级" && radio["cityId"].slice(0, 3) in provinceIdNameMap) {
						allMediaInfoCityMap[provinceIdNameMap[radio["cityId"].slice(0, 3)]].push(radio);
					}
				}

				window.allMediaInfoCityMap = allMediaInfoCityMap;
			}
			callback(window.allMediaInfoCityMap);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get Media Info Map data from server!');
			callback(window.allMediaInfoCityMap);
		}
	});
}

/**
 * 获取地区名和地区id的map
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *      "大连市": "210200",
 *      "江苏省": "320000",
 *      ...
 * }
 *
 * usage：
 * getCityInfoMap(function(data) {
 *     alert(JSON.stringify(data));
 *     // change to list
 *     alert(JSON.stringify(Object.keys(data).map(function(item) {
 *         return {
 *             id: data[item],
 *             txt: item
 *         }
 *     })));
 * });
 */
function getCityInfoMap(callback) {
	window.cityInfoMap = {};

	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'json',
		url: '/Handlers/CityByMediaHandler.ashx?act=getcityList&getcitys=11111',
		success: function(data, textStatus, jqXHR) {
			if (data["Table"]) {
				window.cityInfoMap = data["Table"].reduce(function(obj, item) {
					obj[item["MBX01Name"]] = item["MBX01Id"];
					return obj;
				}, {});
			}
			callback(window.cityInfoMap);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get City Info Map data from server!');
			callback(window.cityInfoMap);
		}
	});
}

/**
 * 智能排期列表查询
 * @param cityName 地区（城市或省份）
 * @param industryName 行业
 * @param beginDate 开始日期
 * @param endDate 结束日期
 * @param budget 预算
 * @param second 秒数
 * @param mediaName 媒体名称（关键字模糊匹配），没有则为空字符串
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *     radioName: "大连交通台",  //电台名称
 *     totalAdvertiseDay: "11",  //投放总天数
 *     totalAdvertiseNumber: "11",  //投放总次数
 *     advertisePrice: "6,765.00",  //投放金额
 *     crossDayAdditionalPrice: "0.00",  //跳播加收金额
 *     totalPrice: "6,765.00",  //投放总金额
 *     earnestPrice: "676.50",  //定金
 *     detail: [
 *         {
 *             dateTxt: "日期",
 *             dateVal: "2016年07月20日",
 *             programTxt: "节目",
 *             programVal: "欢乐同行",
 *             timeRangeTxt: "节目时段（广告播放时刻）",
 *             timeRangeVal: "19:00-20:00 (19:58)",
 *             secondTxt: "秒数",
 *             secondVal: "15秒",
 *             priceTxt: "价格(元)",
 *             priceVal: "615.00"
 *         },  //detail row1, 每行的数据
 *         {...},  //detail row2
 *         ...  //detail row N
 *     ],
 *     audio: [  //素材
 *       {
 *           id: "0",
 *           txt: "音频后期制作"
 *       },
 *       {
 *           id: "29",
 *           txt: "涛略测试主题"
 *       },
 *       ...
 *     ],
 *     orderCode: "xxxxxxxx"  //下一步进行下订单操作需要的一个字符串
 * }
 *
 * usage:
 * switchDataFromIntelligentScheduling('大连', '商业商场', '2016/07/20', '2016/07/30', 20000, 15, '大连交通台', function(data) {
 *     if (!data) {
 *         alert("Can not get any data!")
 *     }
 *     else {
 *         alert(JSON.stringify(data));
 *     }
 * });
 */
function switchDataFromIntelligentScheduling(cityName, industryName, beginDate, endDate, budget, second, mediaName, callback) {
	function _switchDataFromIntelligentScheduling() {
		var industryId = window.industryInfoMap[industryName];
		if (null == industryId) {
			callback(null);
		}
		else {
			$.ajax({
				type: 'POST',
				async: true,
				dataType: 'json',
				url: '/Handlers/IntelligenceHandler.ashx',
				data: {
					cityName: cityName,
					industry: industryName,
					beginDate: beginDate,
					endDate: endDate,
					budget: budget,
					second: second,
					mediaName: mediaName,
				},
				success: function(jsonData, textStatus, jqXHR) {
					/* jsonData格式：
					[{
						"DateArry": "2016-07-05,2016-07-06,2016-07-07,2016-07-08,2016-07-09",
						"Days": "5",
						"Frequency": "5",
						"AdditionalPrice": "2340.0000000000000000",
						"TfPrice": "7800.000000000000",
						"Total": "10140.0000000000000000",
						"ProgrammeArry": "10014#1846#疯狂的Motor#23:00-00:00 (23:15)#15#2600.0000#1435#60.00000000#344#30.0000#1#1560.000000000000#1#山东交通台 FM101.1\u003c#\u003e",
						"Mbr02Id": "10014",
						"Mbr02Name": "山东交通台 FM101.1",
						"IsJS": "True"
					}]
					*/
					if (jsonData) {
						jsonData = jsonData[0];

						var orderCode = $.base64.encode(JSON.stringify({
							_orderTotal: jsonData['Total'],
							dateArry: jsonData['DateArry'],
							isJs: jsonData['IsJS'],
							mbr02Id: jsonData['Mbr02Id'],
							programmeArry: jsonData['ProgrammeArry'],
							secondsArry: second
						}), true);

						$.ajax({
							type: 'POST',
							async: true,
							dataType: 'text',
							url: '/buyIntelligentScheduling.aspx',
							data: {
								Industry: industryId,  //行业ID
								MOL03Name: '', //'音频后期制作',
								additionalPrice: jsonData['AdditionalPrice'],
								city: cityName,
								dateArry: jsonData['DateArry'],
								days: jsonData['Days'],
								frequency: jsonData['Frequency'],
								isJS: jsonData['IsJS'],
								mbr02Id: jsonData['Mbr02Id'],
								mbr02Name: jsonData['Mbr02Name'],
								mol03Id: 0,
								programmeArry: jsonData['ProgrammeArry'],
								second: second,
								tfPrice: jsonData['TfPrice'],
								total: jsonData['Total'],
								txtBudget: budget,
								txtHotelInfo: mediaName,
								txtHotelTime1: beginDate,
								txtHotelTime2: endDate,
								txtIndustry: industryName,
								txtSecond: second,
							},
							dataFilter: function(data, type) {
								return data.replace(/<(?:link|img)\b.*?(\/>|"\s*>)/ig, '').replace(/\r\n|\n/g, '\uffff').replace(/<(script|style)\b.*?<\/\1>/gi, '').replace(/\uffff/g, '\n');
							},
							success: function(data, textStatus, jqXHR) {
								var $analytics = $('div.onxlg-table-wrapper>table.onxlg-table', data);
								var dataSet = {};
								var txtKeyMap = {
									"日期": "date",
									"节目": "program",
									"节目时段（广告播放时刻）": "timeRange",
									"秒数": "second",
									"价格(元)": "price"
								};

								var detailTitleList = $analytics.find('>thead>tr>th').toArray().map(function(item, idx) {
									item = $(item).text().trim();
									if (item in txtKeyMap) {
										return [txtKeyMap[item], item];
									}
									return ["unknown" + idx, item];
								});

								dataSet['radioName'] = $analytics.find('>caption>h4>span').text().trim();
								dataSet['detail'] = $analytics.find('>tbody>tr').toArray().map(function(item) {
									return $('td', item).toArray().reduce(function(prev, item, idx) {
										prev[detailTitleList[idx][0] + "Txt"] = detailTitleList[idx][1];
										prev[detailTitleList[idx][0] + "Val"] = $(item).text().trim();
										return prev;
									}, {});
								});

								dataSet['totalAdvertiseDay'] = $analytics.find('>tfoot>tr:eq(0)>td:eq(1)').text().trim();
								dataSet['totalAdvertiseNumber'] = $analytics.find('>tfoot>tr:eq(0)>td:eq(3)').text().trim();
								dataSet['advertisePrice'] = $analytics.find('>tfoot>tr:eq(1)>td:eq(1)').text().trim();
								dataSet['crossDayAdditionalPrice'] = $analytics.find('>tfoot>tr:eq(2)>td:eq(1)').text().trim();
								dataSet['totalPrice'] = $analytics.find('>tfoot>tr:eq(3)>td:eq(1)').text().trim();
								dataSet['earnestPrice'] = $analytics.find('>tfoot>tr:eq(4)>td:eq(1)').text().trim();
								dataSet['audio'] = $analytics.siblings('div.cataegory-submit').find('div.media-list>span').toArray().map(function(item) {
									var $item = $(item);
									return {
										id: $item.attr('val'),
										txt: $item.text().trim()
									};
								});
								dataSet['orderCode'] = orderCode;

								callback(dataSet);
							},
							error: function(data, textStatus, jqXHR) {
								//alert('Can not get data from server!');
								callback(null);
							}
						});
					}
					else {
						//alert('Empty data get from server on step 1 !');
						callback(null);
					}
				},
				error: function(data, textStatus, jqXHR) {
					//alert('Can not get data from server on step 1 !');
					callback(null);
				}
			});
		}
	}

	//getIndustryIdMap will change window.industryIdMap
	if (!window.industryInfoMap) {
		getIndustryInfoMap(industryName, function () {
			_switchDataFromIntelligentScheduling();
		});
	}
	else {
		_switchDataFromIntelligentScheduling();
	}
}

/**
 * 下订单操作
 * @param orderCode 订单字符串（从switchDataFromIntelligentScheduling获得）
 * @param fullPayOrNot 全额付款=true，定金付款=false
 * @param audioId 音频Id
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *     'url': '',  //支付页面url
 *     'error': '出错原因...'  //出错时候才会有这个字段
 * }
 *
 * usage:
 * switchDataFromIntelligentScheduling('大连', '商业商场', '2016/07/20', '2016/07/27', 9000, 15, '大连交通台', function(data) {
 *     if (!data) {
 *         alert("Can not get any data!")
 *     }
 *     else {
 *         switchDataFromOrdingHandler(data['orderCode'], true, 0, function(data) {
 *             alert(JSON.stringify(data));
 *         });
 *     }
 * });
 */
function switchDataFromOrdingHandler(orderCode, fullPayOrNot, audioId, callback) {
	var orderData = JSON.parse($.base64.decode(orderCode), true);
	orderData['eType'] = fullPayOrNot ? 100 : 200;
	orderData['mol03Id'] = audioId;

	$.ajax({
		type: 'POST',
		async: true,
		dataType: 'text',
		url: '/Handlers/OrderHandler.ashx?act=sv',
		data: orderData,
		success: function(data, textStatus, jqXHR) {
			if (/^\d+$/.test(data)) {
				callback({'url': '/payment.aspx?pl=' + $.base64.encode(data) + '&et=' + (fullPayOrNot ? 100 : 200)})
			}
			else {
				callback({'error': data.replace(/^警告:/, '').trim()});
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not save data on step 1 !');
			callback({'error': '服务器获取数据失败！'});
		}
	});
}

/**
 * 准备支付页面信息
 * @param url 订单准备支付页面的url
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *     orderNumber: "RW-1607-097",  //MAS订单编号
 *     payment: "4920.00",  //支付金额
 *     paymentCode": "xxxxxxx"  //跳到银联网关付款需要的字符串
 * }
 *
 * usage:
 * switchDataFromPayment('/payment.aspx?pl=MjY0NA==&et=100', function(data) {
 *     if (!data) {
 *         alert("Can not get any data!")
 *     }
 *     else {
 *         alert(JSON.stringify(data));
 *     }
 * });
 */
function switchDataFromReadyPaymentPage(url, callback) {
	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'text',
		url: url,
		success: function(data, textStatus, jqXHR) {
			var $analytics = $('div.onxlg-table-wrapper', data);
			var orderAnalyticsItems = $analytics.find('div.onxlg-zhifu>p>span').toArray();
			var orderNumberList = orderAnalyticsItems.filter(function(item) {
				return /^订单号：/.test(($(item).text().trim()));
			}).map(function(item) {
				return $(item).text().trim().replace(/^订单号：/, '').trim()
			});

			var paymentList = orderAnalyticsItems.filter(function(item) {
				return /^待支付：￥/.test(($(item).text().trim()));
			}).map(function(item) {
				return $(item).text().trim().replace(/^待支付：￥/, '').trim()
			});

			var $paymentAnalytics = $analytics.find('div.cxlg-submit>input');
			var paymentCode = $.base64.encode(JSON.stringify({
				pl: $paymentAnalytics.filter('#pl').val(),
				et: $paymentAnalytics.filter('#et').val(),
				amt: $paymentAnalytics.filter('#amt').val(),
				respCode: $paymentAnalytics.filter('#respCode').val(),
				reqReserved: $paymentAnalytics.filter('#reqReserved').val(),
				txnAmt: $paymentAnalytics.filter('#txnAmt').val(),
				orderId: $paymentAnalytics.filter('#orderId').val(),
			}), true);

			callback({
				orderNumber: orderNumberList.length > 0 ? orderNumberList[0] : '',
				payment: paymentList.length > 0 ? paymentList[0] : '',
				paymentCode: paymentCode
			})
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get payment info page on step 1 !');
			callback(null);
		}
	});
}

/**
 * 跳到银联支付页面
 * @param paymentCode 跳到银联网关付款需要的字符串（从switchDataFromReadyPaymentPage获得）
 * @param callback 回调方法
 * 回调方法数据格式：
 *   返回跳转页面html内容（魔法米302再继续跳转到银联）
 *
 * usage:
 * switchDataFromReadyPaymentPage('/payment.aspx?pl=MjY0NA==&et=100', function(data) {
 *     if (!data) {
 *         alert("Can not get any data!")
 *     }
 *     else {
 *         switchDataFromUnionpayPaymentPage(data['paymentCode']);
 *     }
 * });
 */
function switchDataFromUnionpayPaymentPage(paymentCode, callback) {
	$.ajax({
		type: 'POST',
		async: true,
		dataType: 'html',
		url: '/Handlers/Form_FrontConsume.aspx',
		data: JSON.parse($.base64.decode(paymentCode, true)),
		success: function(data, textStatus, jqXHR) {
			callback(data);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not jump to payment page on step 1 !');
			callback(null);
		}
	});
}

/**
 * 登陆
 * @param account 登陆账号(手机号)
 * @param password 密码
 * @param saveInfoOrNot 保存登录框信息到cookie=true，否则为false
 * @param callback 回调方法
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromLogin('13500000000', '1234567', true, function(data) {
 *     if (!data) {
 *         alert('Login successfully!')
 *     }
 *     else {
 *         alert('Login failure! Reason:' + data['error']);
 *     }
 * })
 */
function switchDataFromLogin(account, password, saveInfoOrNot, callback) {
	$.ajax({
		type: 'POST',
		async: true,
		dataType: 'text',
		url: '/Common/Login/OnlineLoginHandler.ashx',
		data: {
			Action: 'Login',
			IsSaveLoginInfo: !!saveInfoOrNot,
			LgName: account,
			LgPwd: password
		},
		success: function(data, textStatus, jqXHR) {
			console.log(data);
			if (!data.startsWith('"\\u003c')) {
				callback({error: data.trim('"')});
			}
			else {
				callback(null);
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not login on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}

/**
 * 登出
 * @param callback 回调方法
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromLogout(function(data) {
 *     if (!data) {
 *         alert('Logout successfully!')
 *     }
 *     else {
 *         alert('Logout failure! Reason:' + data['error']);
 *     }
 * })
 */
function switchDataFromLogout(callback) {
	$.ajax({
		type: 'POST',
		async: true,
		dataType: 'text',
		url: '/Common/Login/OnlineLoginHandler.ashx',
		data: {
			Action: 'LogOut'
		},
		success: function(data, textStatus, jqXHR) {
			if ('""' === data) {
				callback(null);
			}
			else {
				callback({error: data.trim('"')});
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not logout on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}

/**
 * 我的订单列表
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *     all: [  //全部订单tab
 *         {
 *             radioName: "大连交通台",  //电台名称
 *             totalAdvertiseDay: "8",  //投放天数
 *             orderNumber: "RW-1607-097",  //订单号
 *             totalAdvertiseNumber: "8",  //投放总次数
 *             orderTime: "2016-07-13 17:30:00",  //下单时间
 *             totalPrice: "4,920.00",  //总金额
 *             status: "已过期(未支付)",  //状态
 *             detailUrl: "/user/OrderDetails.aspx?PId=2644"  //详情页的URL
 *         },  //第一个订单
 *         { ... },  //第二个订单
 *         ...  //第N个订单
 *     ],
 *     toBePaid: [  //待付款tab
 *         ...  //格式同上
 *     ],
 *     verifyPending: [  //待审核tab
 *         ...  //格式同上
 *     ],
 *     finished: [  //已完成tab
 *         ...  //格式同上
 *     ]
 * }
 *
 * usage:
 * switchDataFromMyOrder(function(data) {
 *     alert(JSON.stringify(data, null, 2));
 * })
 */
function switchDataFromMyOrder(callback) {
	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'text',
		url: '/user/myorder.aspx',
		success: function(data, textStatus, jqXHR) {
			var $analytics = $('div.onxlg-table-wrapper>table.onxlg-table', data);

			var allOrderData = $analytics.eq(0).find('>tbody>tr').toArray().map(function(item) {
				var $td = $('td', item);
				if (!$td.eq(0).hasClass('onxlg-nodata')) {
					var dataSet = {};

					dataSet['radioName'] = $td.eq(0).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseDay'] = $td.eq(0).find('>p:eq(1)>span').text().trim();
					dataSet['orderNumber'] = $td.eq(1).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseNumber'] = $td.eq(1).find('>p:eq(1)>span').text().trim();
					dataSet['orderTime'] = $td.eq(2).find('>p:eq(0)').text().trim();
					dataSet['totalPrice'] = $td.eq(2).find('>p:eq(1)>span').text().trim();
					dataSet['status'] = $td.eq(3).find('>p:eq(0)').text().trim();
					dataSet['detailUrl'] = '/user/' + $td.eq(3).find('>p:eq(1)>a').attr('href');
					return dataSet;
				}
			}).filter(function(item) {
				return !!item;
			});

			var toBePaidOrderData = $analytics.eq(1).find('>tbody>tr').toArray().map(function(item) {
				var $td = $('td', item);
				if (!$td.eq(0).hasClass('onxlg-nodata')) {
					var dataSet = {};

					dataSet['radioName'] = $td.eq(0).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseDay'] = $td.eq(0).find('>p:eq(1)>span').text().trim();
					dataSet['orderNumber'] = $td.eq(1).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseNumber'] = $td.eq(1).find('>p:eq(1)>span').text().trim();
					dataSet['orderTime'] = $td.eq(2).find('>p:eq(0)').text().trim();
					dataSet['totalPrice'] = $td.eq(2).find('>p:eq(1)>span').text().trim();
					dataSet['status'] = $td.eq(3).find('>p:eq(0)').text().trim();
					dataSet['detailUrl'] = '/user/' + $td.eq(3).find('>p:eq(1)>a').attr('href');
					return dataSet;
				}
			}).filter(function(item) {
				return !!item;
			});

			var verifyPendingOrderData = $analytics.eq(2).find('>tbody>tr').toArray().map(function(item) {
				var $td = $('td', item);
				if (!$td.eq(0).hasClass('onxlg-nodata')) {
					var dataSet = {};

					dataSet['radioName'] = $td.eq(0).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseDay'] = $td.eq(0).find('>p:eq(1)>span').text().trim();
					dataSet['orderNumber'] = $td.eq(1).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseNumber'] = $td.eq(1).find('>p:eq(1)>span').text().trim();
					dataSet['orderTime'] = $td.eq(2).find('>p:eq(0)').text().trim();
					dataSet['totalPrice'] = $td.eq(2).find('>p:eq(1)>span').text().trim();
					dataSet['status'] = $td.eq(3).find('>p:eq(0)').text().trim();
					dataSet['detailUrl'] = '/user/' + $td.eq(3).find('>p:eq(1)>a').attr('href');
					return dataSet;
				}
			}).filter(function(item) {
				return !!item;
			});

			var finishedOrderData = $analytics.eq(3).find('>tbody>tr').toArray().map(function(item) {
				var $td = $('td', item);
				if (!$td.eq(0).hasClass('onxlg-nodata')) {
					var dataSet = {};

					dataSet['radioName'] = $td.eq(0).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseDay'] = $td.eq(0).find('>p:eq(1)>span').text().trim();
					dataSet['orderNumber'] = $td.eq(1).find('>p:eq(0)').text().trim();
					dataSet['totalAdvertiseNumber'] = $td.eq(1).find('>p:eq(1)>span').text().trim();
					dataSet['orderTime'] = $td.eq(2).find('>p:eq(0)').text().trim();
					dataSet['totalPrice'] = $td.eq(2).find('>p:eq(1)>span').text().trim();
					dataSet['status'] = $td.eq(3).find('>p:eq(0)').text().trim();
					dataSet['detailUrl'] = '/user/' + $td.eq(3).find('>p:eq(1)>a').attr('href');
					return dataSet;
				}
			}).filter(function(item) {
				return !!item;
			});

			callback({
				all: allOrderData,
				toBePaid: toBePaidOrderData,
				verifyPending: verifyPendingOrderData,
				finished: finishedOrderData
			})
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get my order info page on step 1 !');
			callback(null);
		}
	});
}

/**
 * 获取我的音频
 * @param callback 回调方法
 * 回调方法数据格式：
 * [
 *     {
 *         "name": "涛略测试主题",  //音频名字
 *         "id": "29",  //音频ID
 *         "second": "15s",  //音频秒数
 *         "uploadDate": "2016-07-13",  //上传日期
 *         "url": "http://www.onsite.cn:8087/upfile/MFM_2016713153834_9815_short ver.2-.mp3",  //音频地址
 *         "desc": "涛略测试简介"  //音频描述
 *     },
 *     { ... },
 *     ...
 * ]
 *
 * usage:
 * switchDataFromMyAudio(function(data) {
 *     alert(JSON.stringify(data, null, 2));
 * })
 */
function switchDataFromMyAudio(callback) {
	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'text',
		url: '/user/myaudio.aspx',
		success: function(data, textStatus, jqXHR) {
			var $analytics = $('div.onxlg-table-wrapper>table.onxlg-table', data);

			var allAudioData = $analytics.eq(0).find('>tbody>tr').toArray().map(function (item) {
				var $td = $('td', item);
				if (!$td.eq(0).hasClass('onxlg-nodata')) {
					var dataSet = {};

					dataSet['name'] = $td.eq(0).find('>p:eq(0)').text().trim();
					dataSet['id'] = $td.eq(0).find('>p:eq(1)>span').text().trim();
					dataSet['second'] = $td.eq(1).text().trim();
					dataSet['uploadDate'] = $td.eq(2).text().trim();
					dataSet['url'] = $td.eq(3).find('>p>audio').attr('src').trim();
					dataSet['desc'] = $td.eq(4).text().trim();
					return dataSet;
				}
			}).filter(function (item) {
				return !!item;
			});

			callback(allAudioData);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get audio info page on step 1 !');
			callback(null);
		}
	});
}


/**
 * 更改密码
 * @param currentPassword 当前密码
 * @param newPassword 新密码
 * @param confirmPassword 新密码再次确认密码
 * @param callback 回调方法
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromChangePassword(function(data) {
 *     if (!data) {
 *         alert('Change password successfully!')
 *     }
 *     else {
 *         alert('Change password failure! Reason:' + data['error']);
 *     }
 * })
 */
function switchDataFromChangePassword(currentPassword, newPassword, confirmPassword, callback) {
	$.ajax({
		type: 'POST',
		async: true,
		dataType: 'text',
		url: '/Common/BaseInfo/UserInfoEdit.ashx',
		data: {
			Action: 'ModifyAccountPwd',
			OldPwd: currentPassword,
			Password: newPassword,
			ConfirmPwd: confirmPassword,
		},
		success: function(data, textStatus, jqXHR) {
			if ('""' === data) {
				callback(null);
			}
			else {
				callback({error: data.trim('"')});
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not change password on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}

/**
 * 智能排期列表查询
 * @param orderId 订单ID
 * @param callback 回调方法
 * 回调方法数据格式：
 * {
 *     radioName: "大连交通台",  //电台名称
 *     totalAdvertiseDay: "11",  //投放总天数
 *     totalAdvertiseNumber: "11",  //投放总次数
 *     advertisePrice: "6,765.00",  //投放金额
 *     crossDayAdditionalPrice: "0.00",  //跳播加收金额
 *     totalPrice: "6,765.00",  //投放总金额
 *     hasPay: "676.50",  //已付金额
 *     hasNotPay: "6088.50",  //待付余额
 *     status: "账号待审核（已付定金）",  //订单状态
 *     orderId: "RW-1607-097",  //订单编号
 *     orderTime: "2016-07-13 17:30:00",  //下单时间
 *     payId: "20160718144048",  //支付编号
 *     payTime: "2016-07-18 14:46:00", //支付时间
 *     detail: [
 *         {
 *             dateTxt: "日期",
 *             dateVal: "2016年07月20日",
 *             programTxt: "节目",
 *             programVal: "边走边唱",
 *             timeRangeTxt: "节目时段（广告播放时刻）",
 *             timeRangeVal: "19:00-20:00 (19:58)",
 *             secondTxt: "秒数",
 *             secondVal: "15秒",
 *             priceTxt: "价格(元)",
 *             priceVal: "615.00"
 *         },  //detail row1, 每行的数据
 *         {...},  //detail row2
 *         ...  //detail row N
 *     ],
 * }
 *
 * usage:
 * switchDataFromOrderDetail('2643', function(data) {
 *     if (!data) {
 *         alert("Can not get any data!")
 *     }
 *     else {
 *         alert(JSON.stringify(data));
 *     }
 * });
 */
function switchDataFromOrderDetail(orderId, callback) {
	$.ajax({
		type: 'GET',
		async: true,
		dataType: 'text',
		url: '/user/OrderDetails.aspx?PId=' + orderId,
		success: function(data, textStatus, jqXHR) {
			var $analytics = $('div.onxlg-table-wrapper>table.onxlg-table', data);
			var dataSet = {};
			var txtKeyMap = {
				"日期": "date",
				"节目": "program",
				"节目时段（广告播放时刻）": "timeRange",
				"秒数": "second",
				"价格(元)": "price"
			};

			var detailTitleList = $analytics.find('>thead>tr>th').toArray().map(function (item, idx) {
				item = $(item).text().trim();
				if (item in txtKeyMap) {
					return [txtKeyMap[item], item];
				}
				return ["unknown" + idx, item];
			});

			dataSet['radioName'] = $analytics.find('>caption>h4>span').text().trim();
			dataSet['detail'] = $analytics.find('>tbody>tr').toArray().map(function (item) {
				return $('td', item).toArray().reduce(function (prev, item, idx) {
					prev[detailTitleList[idx][0] + "Txt"] = detailTitleList[idx][1];
					prev[detailTitleList[idx][0] + "Val"] = $(item).text().trim();
					return prev;
				}, {});
			});

			dataSet['totalAdvertiseDay'] = $analytics.find('>tfoot>tr:eq(0)>td:eq(1)').text().trim();
			dataSet['totalAdvertiseNumber'] = $analytics.find('>tfoot>tr:eq(0)>td:eq(3)').text().trim();
			dataSet['advertisePrice'] = $analytics.find('>tfoot>tr:eq(1)>td:eq(1)').text().trim();
			dataSet['crossDayAdditionalPrice'] = $analytics.find('>tfoot>tr:eq(2)>td:eq(1)').text().trim();
			dataSet['totalPrice'] = $analytics.find('>tfoot>tr:eq(3)>td:eq(1)').text().trim();
			dataSet['hasPay'] = $analytics.find('>tfoot>tr:eq(4)>td:eq(1)').text().trim();
			dataSet['hasNotPay'] = $analytics.find('>tfoot>tr:eq(5)>td:eq(1)').text().trim();
			dataSet['status'] = $analytics.find('>tfoot>tr:eq(6)>td:eq(1)').text().trim();
			dataSet['orderId'] = $analytics.find('>tfoot>tr:eq(7)>td:eq(1)').text().trim();
			dataSet['orderTime'] = $analytics.find('>tfoot>tr:eq(8)>td:eq(1)').text().trim();
			dataSet['payId'] = $analytics.find('>tfoot>tr:eq(9)>td:eq(1)').text().trim();
			dataSet['payTime'] = $analytics.find('>tfoot>tr:eq(10)>td:eq(1)').text().trim();

			callback(dataSet);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not get data from server!');
			callback(null);
		}
	});
}


/**
 * 验证手机号是否被注册
 * @param phoneNumber 手机号
 * @param callback
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromCheckPhone(function('13500000000', data) {
 *     if (!data) {
 *         alert('Check phone pass!')
 *     }
 *     else {
 *         alert('Check phone not pass! Reason:' + data['error']);
 *     }
 * })
 */
//TODO 此方法还没完成
function __switchDataFromCheckPhone(phoneNumber, callback) {
	$.ajax({
		type: 'POST',
		async: true,
		cache: false,
		dataType: 'json',
		url: '',
		data: {
			//
		},
		success: function(data, textStatus, jqXHR) {
			if (!!data) {
				callback(null);
			}
			else {
				callback({error: data.trim('"')});
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not check phone on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}

/**
 * 生成手机验证码
 * @param phoneNumber 手机号
 * @param callback
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromGeneratePhoneCode('13500000000', function(data) {
 *     if (!data) {
 *         alert('Generate phone code successfully!')
 *     }
 *     else {
 *         alert('Generate phone code failure! Reason:' + data['error']);
 *     }
 * })
 */
function switchDataFromGeneratePhoneCode(phoneNumber, callback) {
	$.ajax({
		type: 'POST',
		async: true,
		cache: false,
		dataType: 'json',
		url: '/Common/Login/OnlineRegisterHandler.ashx',
		data: {
			Action: 'CreatePhoneCode',
			LgName: phoneNumber
		},
		success: function(data, textStatus, jqXHR) {
			if (!!data) {
				callback(null);
			}
			else {
				callback({error: data.trim('"')});
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not generate phone code on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}

/**
 * 注册
 * @param phoneNumber 手机号
 * @param phoneVerificationCode 验证码
 * @param email 邮箱
 * @param password 密码
 * @param companyName 公司名
 * @param callback
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromRegister('13500000000',, 'ABCD', 'example@abc123.com', '1234567', 'test company', function(data) {
 *     if (!data) {
 *         alert('Register successfully!')
 *     }
 *     else {
 *         alert('Register failure! Reason:' + data['error']);
 *     }
 * })
 */
function switchDataFromRegister(phoneNumber, phoneVerificationCode, email, password, companyName, callback) {
	$.ajax({
		type: 'POST',
		async: true,
		cache: false,
		dataType: 'json',
		url: '/Common/Login/OnlineRegisterHandler.ashx',
		data: {
			Action: 'RegisterByPhone',
			LgName: phoneNumber,
			PhoneCode: phoneVerificationCode,
			Email: email,
			LgTelNum: phoneNumber,
			LgPwd: password,
			LgCompanyName: companyName
		},
		success: function(data, textStatus, jqXHR) {
			if (data == 'fail') {
				callback({error: "该手机已注册!"});

			} else if (data == 'company') {
				callback({error: "该公司名称已注册!"});
			}
			else if (data == 'phonecode1') {
				callback({error: "手机验证码已过期或未获取!"});
			}
			else if (data == 'phonecode2') {
				callback({error: "手机验证码错误"});
			}
			else {
				callback(null);
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not register on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}

/**
 * 忘记密码
 * @param email 邮箱
 * @param callback
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromRegister('test@example.com', function(data) {
 *     if (!data) {
 *         alert('Register successfully!')
 *     }
 *     else {
 *         alert('Register failure! Reason:' + data['error']);
 *     }
 * })
 */
function switchDataFromForgetPassword(email, callback) {
	$.ajax({
		type: 'POST',
		async: true,
		cache: false,
		dataType: 'json',
		url: '/Common/Login/OnlineLoginHandler.ashx',
		data: {
			Action: 'ResetPwdBySendEmail',
			LgName: email
		},
		success: function(data, textStatus, jqXHR) {
			if (!!data) {
				callback(null);
			}
			else {
				callback({error: data.trim('"')});
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not register on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}


/**
 * 上传审核资料（下面字段没有值就用空字符串替代）
 * @param userName 用户名
 * @param accountEmail 登陆邮箱
 * @param phoneNumber 手机号码
 * @param faxNumber 传真号
 * @param qqNumber QQ号
 * @param msnNumber MSN号
 * @param description 说明
 * @param companyName 企业名字
 * @param companyLicenseCode 企业营业执照注册号
 * @param address 常用地址
 * @param companyEmail 企业邮箱
 * @param licenseImage 营业执照副本扫描件图片数据
 * @param licenseImageId 营业执照副本扫描件ID(不存在则为0)
 * @param licenseImageFileId 营业执照副本扫描件文件ID(不存在则为0)
 * @param addtionalImage1 辅助资料1图片数据
 * @param addtionalImage1Id 辅助资料1图片ID
 * @param addtionalImage1FileId 辅助资料1图片文件ID
 * @param addtionalImage2 辅助资料2图片数据
 * @param addtionalImage2Id 辅助资料2图片ID
 * @param addtionalImage2FileId 辅助资料2图片文件ID
 * @param addtionalImage3 辅助资料3图片数据
 * @param addtionalImage3Id 辅助资料3图片ID
 * @param addtionalImage3FileId 辅助资料3图片文件ID
 * @param addtionalImage4 辅助资料4图片数据
 * @param addtionalImage4Id 辅助资料4图片ID
 * @param addtionalImage4FileId 辅助资料4图片文件ID
 * @param addtionalImage5 辅助资料5图片数据
 * @param addtionalImage5Id 辅助资料5图片ID
 * @param addtionalImage5FileId 辅助资料5图片文件ID
 * @param addtionalImage6 辅助资料6图片数据
 * @param addtionalImage6Id 辅助资料6图片ID
 * @param addtionalImage6FileId 辅助资料6图片文件ID
 * @param callback 回调方法
 * 回调方法数据格式：
 * 正常回调数据为null
 * 出错时候：
 * {
 *     error: "xxxx"  //错误信息
 * }
 *
 * usage:
 * switchDataFromChangePassword(function(data) {
 *     if (!data) {
 *         alert('Change password successfully!')
 *     }
 *     else {
 *         alert('Change password failure! Reason:' + data['error']);
 *     }
 * })
 */
//TODO 此方法还没完成
function __switchDataFromUploadUserVerifiedData(
	userName,
	accountEmail,
	phoneNumber,
	faxNumber,
	qqNumber,
	msnNumber,
	description,
	companyName,
	companyLicenseCode,
	address,
	companyEmail,
	licenseImage,
	licenseImageId,
	licenseImageFileId,
	addtionalImage1,
	addtionalImage1Id,
	addtionalImage1FileId,
	addtionalImage2,
	addtionalImage2Id,
	addtionalImage2FileId,
	addtionalImage3,
	addtionalImage3Id,
	addtionalImage3FileId,
	addtionalImage4,
	addtionalImage4Id,
	addtionalImage4FileId,
	addtionalImage5,
	addtionalImage5Id,
	addtionalImage5FileId,
	addtionalImage6,
	addtionalImage6Id,
	addtionalImage6FileId,
	callback) {
	$.ajax({
		type: 'POST',
		async: true,
		contentType: 'multipart/form-data',
		dataType: 'text',
		url: '/user/userinfo.aspx',
		data: {
			MBCA2Contact: userName,
			MBCA2Email: accountEmail,
			MBCA2Tel: phoneNumber,
			MBCA2Fax: faxNumber,
			MBCA2QQ: qqNumber,
			MBCA2MSN: msnNumber,
			MBCA2Desc: description,
			MBCA1Name: companyName,
			MBCA1Code: companyLicenseCode,
			MBCA1Address: address,
			MBCA1Desc: companyEmail,
			license: licenseImage,
			MBCA4Id1: licenseImageId,
			wj1: licenseImageFileId,
			auxiliary1: addtionalImage1,
			MBCA4Id2: addtionalImage1Id,
			wj2: addtionalImage1FileId,
			auxiliary2: addtionalImage2,
			MBCA4Id3: addtionalImage2Id,
			wj3: addtionalImage2FileId,
			auxiliary3: addtionalImage3,
			MBCA4Id4: addtionalImage3Id,
			wj4: addtionalImage3FileId,
			auxiliary4: addtionalImage4,
			MBCA4Id5: addtionalImage4Id,
			wj5: addtionalImage4FileId,
			auxiliary5: addtionalImage5,
			MBCA4Id6: addtionalImage5Id,
			wj6: addtionalImage5FileId,
			auxiliary6: addtionalImage6,
			MBCA4Id7: addtionalImage6Id,
			wj7: addtionalImage6FileId
		},
		success: function(data, textStatus, jqXHR) {
			if ('""' === data) {
				callback(null);
			}
			else {
				callback({error: data.trim('"')});
			}
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not change password on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}


function radioAudienceCompositionAnalysis(radioName, callback) {
	$.ajax({
		type: 'GET',
		async: true,
		cache: false,
		dataType: 'json',
		url: '/data/radio_audience_composition_analysis',
		success: function(data, textStatus, jqXHR) {
			var result = [];
			var radioData = data[radioName];
			if (radioData) {
				for (var category in radioData) {
					var categoryData = radioData[category];
					if (categoryData) {
						var filedNameList = [];
						var valueList = [];
						for (var item in categoryData) {
							filedNameList.push(item);
							valueList.push(categoryData[item]);
						}
						result.push({
							tableName: category,
							name: filedNameList,
							distribute: valueList
						});
					}
				}
			}
			callback(result);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not radio audience composition on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}

function radioPeriodAnalysis(radioName, programKeyList, callback) {
	$.ajax({
		type: 'GET',
		async: true,
		cache: false,
		dataType: 'json',
		url: '/data/radio_period_analysis',
		success: function(data, textStatus, jqXHR) {
			var total = 0;
			var sumResult = [0, 0, 0, 0];
			var radioData = data[radioName];
			if (radioData) {
				for (var programKeyIdx in programKeyList) {
					var items = radioData[programKeyList[programKeyIdx]];
					if (items) {
						for (var i=0; i<4; i++) {
							sumResult[i] += items[i];
							total += items[i];
						}
					}
				}
			}

			var result = {
				tableName: "听众场景",
				name: ["其它场所", "工作/学习场所", "车上" , "在家"],
				distribute: sumResult,
				total: total
			};
			callback(result);
		},
		error: function(data, textStatus, jqXHR) {
			//alert('Can not radio audience composition on step 1 !');
			callback({error: "连接服务器异常!"});
		}
	});
}
