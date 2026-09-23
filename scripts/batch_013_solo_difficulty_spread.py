# Batch 13: standalone statements deliberately spanning a wide difficulty
# range within the same short/direct style — some questions anyone with
# passing general knowledge would get instantly, others genuinely obscure
# enough that a rabbinic scholar might have to think hard (or guess).
# "Hard" here means rare/technical knowledge, never a genuinely disputed or
# ambiguous fact — every item below is a well-documented, uncontested claim,
# just a very obscure one in the harder tier.

ENTRIES = [
    # --- very easy (true) ---
    ("holidays", "Hanukkah is a Jewish holiday traditionally celebrated by lighting candles.", True,
     "Lighting candles on a menorah/chanukiah each night is the defining Hanukkah custom."),
    ("symbols", "The Star of David is a widely recognized symbol of Judaism.", True,
     "The six-pointed Star of David is one of the most widely recognized Jewish symbols."),
    ("holidays", "Passover is a Jewish holiday during which matzah, an unleavened bread, is traditionally eaten.", True,
     "Eating matzah, unleavened bread, is a defining Passover custom."),
    ("lifecycle", "A bar mitzvah traditionally marks a Jewish boy's religious coming of age.", True,
     "A bar mitzvah traditionally marks a boy's transition to religious adulthood, around age 13."),
    ("texts", "The Torah is one of the central sacred texts in Judaism.", True,
     "The Torah is the foundational sacred text of Judaism."),
    ("holidays", "Yom Kippur is traditionally observed with a full day of fasting.", True,
     "A full day of fasting is a defining feature of Yom Kippur observance."),
    ("shabbat", "Shabbat is the traditional Jewish day of rest, observed weekly.", True,
     "Shabbat is the weekly day of rest, from Friday sunset to Saturday nightfall."),
    ("synagogue", "A rabbi is traditionally a Jewish religious teacher or leader.", True,
     "A rabbi is traditionally a teacher and authority on Jewish law and tradition."),

    # --- very easy (false) ---
    ("shabbat", "The Jewish Sabbath traditionally falls on Sunday.", False,
     "Shabbat traditionally runs from Friday sunset to Saturday nightfall, not Sunday."),
    ("holidays", "Matzah, eaten during Passover, is traditionally a soft, fluffy, leavened bread.", False,
     "Matzah is unleavened and flat by definition — the opposite of soft and fluffy."),
    ("holidays", "Hanukkah is traditionally celebrated during the summer months.", False,
     "Hanukkah falls in the Hebrew month of Kislev, typically landing in November or December, not summer."),
    ("ritual_objects", "A kippah (yarmulke) is traditionally a type of shoe worn during prayer.", False,
     "A kippah is a head covering, not a shoe."),
    ("texts", "The Torah is traditionally written in the English language.", False,
     "The Torah is traditionally written in Hebrew, not English."),
    ("kashrut", "Kosher dietary laws have no connection to Judaism and are purely a modern marketing term.", False,
     "Kosher dietary laws are traditional Jewish religious law, not a modern marketing invention."),
    ("synagogue", "A synagogue is traditionally a type of Jewish religious text, similar to the Torah.", False,
     "A synagogue is a building — a place of worship and communal gathering — not a text."),

    # --- genuinely obscure (true) ---
    ("holidays", "The Hebrew month of Cheshvan is sometimes called 'Mar-Cheshvan' (bitter Cheshvan) because, traditionally, it is the only month with no Jewish holidays at all.", True,
     "Cheshvan is traditionally the one month on the Hebrew calendar with no holidays, hence the 'bitter' nickname some give it."),
    ("texts", "The Book of Esther is unusual among books of the Hebrew Bible in that it never explicitly mentions God by name.", True,
     "Esther is well known among traditional commentators for never explicitly naming God, unlike most other biblical books."),
    ("language", "According to a traditional homiletical teaching, the Hebrew letters of the month name 'Elul' are read as an acronym for a phrase from Song of Songs meaning 'I am my beloved's and my beloved is mine.'", True,
     "This is a well-known traditional acrostic teaching (notarikon) tied to Elul's role as a month of introspection."),
    ("texts", "Sefer Yetzirah ('Book of Formation') is traditionally considered one of the earliest texts of Jewish mysticism, describing creation through the 22 Hebrew letters and ten sefirot.", True,
     "Sefer Yetzirah is a foundational early mystical text built around the 22 Hebrew letters and ten sefirot."),
    ("texts", "The Talmudic tractate Zevachim deals primarily with the laws of animal sacrifices.", True,
     "Zevachim, part of Seder Kodashim, is specifically concerned with sacrificial law."),
    ("people", "According to Talmudic tradition, Hillel the Elder, like Moses, is said to have lived to the age of 120.", True,
     "Tradition attributes a 120-year lifespan to Hillel, paralleling the traditional account of Moses's own lifespan."),
    ("lifecycle", "A traditional Jewish bill of divorce (get) is customarily handwritten in exactly twelve lines.", True,
     "Twelve lines is the traditional customary length for a handwritten get, tied to the gematria of the word itself."),

    # --- genuinely obscure (false) ---
    ("texts", "The Mishnah's six orders were compiled by Ezra the Scribe, centuries before the Talmudic period.", False,
     "The Mishnah was compiled by Judah HaNasi around 200 CE; Ezra lived centuries earlier and wasn't involved in compiling it."),
    ("people", "Rashi's Torah commentary was written in Aramaic, the everyday spoken language of his community in 11th-century France.", False,
     "Rashi wrote primarily in Hebrew, occasionally glossing difficult words in Old French — not Aramaic."),
    ("texts", "Sefer Yetzirah is a legal code focused primarily on the laws of kosher slaughter.", False,
     "Sefer Yetzirah is a mystical, cosmological text about creation, not a legal code about slaughter."),
    ("prayer", "The 'Aleinu' prayer, recited near the end of daily services, was composed in the 20th century as a modern addition to Jewish liturgy.", False,
     "Aleinu is traditionally understood to be a much older prayer, recited for many centuries, not a 20th-century composition."),
    ("people", "According to Talmudic tradition, Rabbi Akiva was a child prodigy who had mastered the entire Torah by age ten.", False,
     "Tradition holds that Akiva was unlearned until adulthood, traditionally said to have begun serious Torah study around age 40."),
    ("people", "Maimonides, in his Thirteen Principles of Faith, included a principle requiring pilgrimage to Jerusalem three times a year.", False,
     "Maimonides' Thirteen Principles are theological beliefs (God's unity, the Torah's divine origin, and so on) — the three annual pilgrimages are a separate, older Temple-era practice, not one of the Thirteen Principles."),
]
