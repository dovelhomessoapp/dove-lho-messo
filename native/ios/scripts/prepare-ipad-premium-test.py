"""Prepare simulator-only data in the generated project."""
import json
from pathlib import Path


def replace_once(path, anchor, replacement):
    source = path.read_text()
    if source.count(anchor) != 1:
        raise ValueError(f"Unexpected test anchor in {path}: {anchor}")
    path.write_text(source.replace(anchor, replacement))


app = Path("ios/App/App")
web = app / "public"
for page_name in ("index.html", "casa-dolce-casa.html"):
    replace_once(web / page_name, "</head>", """
<script>
for (const page of ['home', 'premium']) localStorage.setItem('dlm-guide-seen-v4-' + page, '1');
</script>
</head>""")
bridge = web / "casa-dolce-casa-bridge.js"
replace_once(bridge, "   const accountID = currentFamilyUserId();\n   const homeID = house?.id;",
             """   const accountID = '00000000-0000-4000-8000-000000000001';
   const homeID = '00000000-0000-4000-8000-000000000002';""")
replace_once(bridge, "   if (!token || !accountID || !homeID) {\n    message.textContent",
             "   if (!accountID || !homeID) {\n    message.textContent")
replace_once(bridge, "session:token, accountID, homeID, restore:isRestore, plan",
             "session:'ipad-storekit-test', accountID, homeID, restore:isRestore, plan")
replace_once(bridge, """    if (homeID !== house?.id || accountID !== currentFamilyUserId()) {
     message.textContent = '';
     return;
    }
""", "")
replace_once(bridge, "    if (outcome === 'activated') await loadPremiumStatus();", "")
# Execute real StoreKit calls while keeping the test independent of production accounts.
swift = app / "PremiumStore.swift"
replace_once(swift, "        let (_, response) = try await URLSession.shared.data(for: request)\n        let status = (response as? HTTPURLResponse)?.statusCode",
             """        let status: Int? = token == "ipad-storekit-test" ? 200 : 403""")
for anchor, message in [
    ("                for await result in Transaction.currentEntitlements {", "Inspect existing entitlements"),
    ("                let outcome = try await PremiumStore.purchase(", "Request new purchase"),
    ("            result = try await product.purchase(confirmIn: scene, options: options)", "Present StoreKit purchase"),
    ("        switch result {", "StoreKit returned"),
]:
    indent = anchor[:len(anchor) - len(anchor.lstrip())]
    replace_once(swift, anchor, f'{indent}NSLog("DLMStoreKitTest: {message}")\n{anchor}')

group_id = "E201CCCA"
subscriptions = [
    {
        "adHocOffers": [], "codeOffers": [], "displayPrice": price,
        "familyShareable": False, "groupNumber": 1, "internalID": identifier,
        "introductoryOffer": None, "localizations": [
            {"description": name, "displayName": name, "locale": "it_IT"}
        ],
        "productID": "it.dovelhomesso.casadolcecasa.premium." + plan,
        "recurringSubscriptionPeriod": period, "referenceName": name,
        "subscriptionGroupID": group_id, "type": "RecurringSubscription",
    }
    for plan, price, period, name, identifier in [
        ("annuale", "49.99", "P1Y", "Premium annuale", "1F38CDA1"),
        ("mensile", "5.99", "P1M", "Premium mensile", "1F38CDA2"),
    ]
]
config = {
    "identifier": "E201CCC0", "products": [], "nonRenewingSubscriptions": [],
    "settings": {"_locale": "it_IT", "_storefront": "ITA"},
    "subscriptionGroups": [
        {"id": group_id, "name": "Premium", "localizations": [], "subscriptions": subscriptions}
    ],
    "version": {"major": 4, "minor": 0},
}
test_config = Path("ios/App/StoreScreenshots/Premium.storekit")
test_config.write_text(json.dumps(config, indent=2))
