-- TABLES --
CREATE TABLE IF NOT EXISTS Metadata (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    defaultProject TEXT,
    FOREIGN KEY (defaultProject) REFERENCES ProjectConfig(id)
);
CREATE TABLE IF NOT EXISTS CodeInfo (
    id TEXT PRIMARY KEY,
    name TEXT,
    data TEXT
);
CREATE TABLE IF NOT EXISTS CodeInfoColId (
    id TEXT,
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS CodeInfoCol (
    idid TEXT,
    parentId TEXT,
    childId TEXT,
    "order" INTEGER,
    PRIMARY KEY (idid, parentId, childId),
    FOREIGN KEY (idid) REFERENCES CodeInfoColId(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES CodeInfo(id) ON DELETE CASCADE,
    FOREIGN KEY (childId) REFERENCES CodeInfo(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Section (
    id TEXT PRIMARY KEY,
    name TEXT,
    data TEXT,
    paramSweepSectionId TEXT,
    uiTypeId TEXT,
    uiTypeColId TEXT,
    defaultVariantId TEXT,
    FOREIGN KEY (paramSweepSectionId) REFERENCES Section(id) ON DELETE SET NULL,
    FOREIGN KEY (uiTypeId) REFERENCES UIType(id) ON DELETE CASCADE,
    FOREIGN KEY (uiTypeColId) REFERENCES UITypeColId(id) ON DELETE SET NULL
    FOREIGN KEY (defaultVariantId) REFERENCES SectionVariantId(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS SectionConfig (
    projectConfigId TEXT,
    data TEXT,
    sectionId TEXT,
    variantId TEXT,
    PRIMARY KEY (projectConfigId, sectionId),
    FOREIGN KEY (projectConfigId) REFERENCES ProjectConfig(id) ON DELETE CASCADE,
    FOREIGN KEY (sectionId) REFERENCES Section(id) ON DELETE CASCADE,
    FOREIGN KEY (variantId) REFERENCES SectionVariantId(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS SectionConfigSelectedVariants (
    projectConfigId TEXT,
    sectionId TEXT,
    variantId TEXT,
    PRIMARY KEY (projectConfigId, sectionId, variantId),
    FOREIGN KEY (projectConfigId) REFERENCES ProjectConfig(id) ON DELETE CASCADE,
    FOREIGN KEY (sectionId) REFERENCES Section(id) ON DELETE CASCADE,
    FOREIGN KEY (variantId) REFERENCES SectionVariantId(id) ON DELETE CASCADE
); 
CREATE TABLE IF NOT EXISTS SectionVariantId (
    id TEXT PRIMARY KEY,
    name TEXT,
    data TEXT,
    selectedItem TEXT,
    codeInfoColId TEXT,
    originSectionId TEXT,
    FOREIGN KEY (selectedItem) REFERENCES CodeInfo(id) ON DELETE SET NULL,
    FOREIGN KEY (originSectionId) REFERENCES Section(id) ON DELETE CASCADE,
    FOREIGN KEY (codeInfoColId) REFERENCES CodeInfoColId(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS SectionVariantEV (
    idid TEXT,
    codeInfoId TEXT,
    data TEXT,
    PRIMARY KEY (idid, codeInfoId),
    FOREIGN KEY (idid) REFERENCES SectionVariantId(id) ON DELETE CASCADE,
    FOREIGN KEY (codeInfoId) REFERENCES CodeInfo(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS SectionVariantChildren (
    idid TEXT,
    childId TEXT,
    "order" INTEGER,
    PRIMARY KEY (idid, childId),
    FOREIGN KEY (idid) REFERENCES SectionVariantId(id) ON DELETE CASCADE,
    FOREIGN KEY (childId) REFERENCES Section(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS SectionVariantParamSweep (
    idid TEXT,
    selectedItemGroupNum INTEGER,
    paramInfoGroupNum INTEGER,
    selectedItem TEXT,
    paramInfoId TEXT,
    "order" INTEGER,
    value TEXT,
    PRIMARY KEY (idid, "order"),
    FOREIGN KEY (idid) REFERENCES SectionVariantId(id) ON DELETE CASCADE,
    FOREIGN KEY (selectedItem) REFERENCES CodeInfo(id) ON DELETE CASCADE,
    FOREIGN KEY (paramInfoId) REFERENCES CodeInfo(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS SectionVariantRunGroup (
    idid TEXT,
    sectionId TEXT,
    parentVariantId TEXT,
    selected BOOLEAN,
    PRIMARY KEY (idid, sectionId, parentVariantId),
    FOREIGN KEY (idid) REFERENCES SectionVariantId(id) ON DELETE CASCADE,
    FOREIGN KEY (sectionId) REFERENCES Section(id) ON DELETE CASCADE
    FOREIGN KEY (parentVariantId) REFERENCES SectionVariantId(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS SectionVariantRunGroupVersions (
    idid TEXT,
    sectionId TEXT,
    parentVariantId TEXT,
    versionId TEXT,
    selected BOOLEAN,
    PRIMARY KEY (idid, sectionId, parentVariantId, versionId),
    FOREIGN KEY (idid, sectionId, parentVariantId) 
        REFERENCES SectionVariantRunGroup(idid, sectionId, parentVariantId) 
        ON DELETE CASCADE,
    FOREIGN KEY (versionId) REFERENCES SectionVariantId(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS SectionVariantRunGroupParamSweeps (
    idid TEXT,
    sectionId TEXT,
    parentVariantId TEXT,
    sweepId TEXT,
    selected BOOLEAN,
    PRIMARY KEY (idid, sectionId, parentVariantId, sweepId),
    FOREIGN KEY (idid, sectionId, parentVariantId) 
        REFERENCES SectionVariantRunGroup(idid, sectionId, parentVariantId) 
        ON DELETE CASCADE,
    FOREIGN KEY (sweepId) REFERENCES SectionVariantId(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS EVRefs (
    variantId TEXT,
    codeInfoId TEXT,
    referringParamInfoId TEXT,
    sectionId TEXT,
    paramInfoId TEXT,
    isArgsObj BOOLEAN,
    startPos INTEGER,
    keyword TEXT,
    PRIMARY KEY (variantId, codeInfoId, referringParamInfoId, startPos),
    FOREIGN KEY (variantId) REFERENCES SectionVariantId(id) ON DELETE CASCADE,
    FOREIGN KEY (codeInfoId) REFERENCES CodeInfo(id) ON DELETE CASCADE,
    FOREIGN KEY (referringParamInfoId) REFERENCES CodeInfo(id) ON DELETE CASCADE,
    FOREIGN KEY (sectionId) REFERENCES Section(id) ON DELETE CASCADE,
    FOREIGN KEY (paramInfoId) REFERENCES CodeInfo(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS TemplateVars (
    variantId TEXT,
    sectionId TEXT,
    startPos INTEGER,
    keyword TEXT,
    PRIMARY KEY (variantId, startPos),
    FOREIGN KEY (variantId) REFERENCES SectionVariantId(id) ON DELETE CASCADE,
    FOREIGN KEY (sectionId) REFERENCES Section(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS UIType (
    id TEXT PRIMARY KEY,
    type TEXT,
    data TEXT,
    asNonPresetForSectionId TEXT,
    asNonPresetForUITypeColId TEXT,
    asNonPresetForCodeInfoId TEXT,
    FOREIGN KEY (asNonPresetForSectionId) REFERENCES Section(id) ON DELETE CASCADE,
    FOREIGN KEY (asNonPresetForUITypeColId, asNonPresetForCodeInfoId) REFERENCES UITypeCol(idid, codeInfoId) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS UITypeColId (
    id TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS UITypeCol (
    idid TEXT,
    codeInfoId TEXT,
    uiTypeId TEXT,
    PRIMARY KEY (idid, codeInfoId),
    FOREIGN KEY (idid) REFERENCES UITypeColId(id) ON DELETE CASCADE,
    FOREIGN KEY (codeInfoId) REFERENCES CodeInfo(id) ON DELETE CASCADE,
    FOREIGN KEY (uiTypeId) REFERENCES UIType(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ProjectConfig (
    id TEXT PRIMARY KEY,
    name TEXT,
    data TEXT,
    UNIQUE (name)
);
CREATE TABLE IF NOT EXISTS ProjectConfigChildren (
    parentId TEXT,
    childId TEXT,
    x REAL,
    y REAL,
    zIndex INTEGER,
    w REAL,
    h REAL,
    PRIMARY KEY (parentId, childId),
    FOREIGN KEY (parentId) REFERENCES ProjectConfig(id) ON DELETE CASCADE,
    FOREIGN KEY (childId) REFERENCES Section(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Artifact (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL DEFAULT '',
    value TEXT,
    type TEXT NOT NULL,
    UNIQUE (name, path, type)
);
CREATE TABLE IF NOT EXISTS ArtifactGroupId (
    id TEXT PRIMARY KEY,
    name TEXT,
    data TEXT,
    originSectionId TEXT,
    "order" INTEGER,
    FOREIGN KEY (originSectionId) REFERENCES Section(id) ON DELETE CASCADE

);
CREATE TABLE IF NOT EXISTS ArtifactGroup (
    idid TEXT,
    artifactId TEXT,
    data TEXT,
    "order" INTEGER,
    PRIMARY KEY (idid, "order"),
    FOREIGN KEY (idid) REFERENCES ArtifactGroupId(id) ON DELETE CASCADE,
    FOREIGN KEY (artifactId) REFERENCES Artifact(id) ON DELETE CASCADE
);

-- INSERTS ---
INSERT OR IGNORE INTO Metadata (id, defaultProject) VALUES (1, NULL);



-- TRIGGERS --
CREATE TRIGGER IF NOT EXISTS set_new_default_project 
AFTER DELETE ON ProjectConfig
WHEN (SELECT defaultProject FROM Metadata WHERE id = 1) = OLD.id
BEGIN
    UPDATE Metadata 
    SET defaultProject = (
        SELECT id 
        FROM ProjectConfig 
        LIMIT 1
    )
    WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS set_default_project_if_null 
AFTER INSERT ON ProjectConfig
WHEN (SELECT defaultProject FROM Metadata WHERE id = 1) IS NULL
BEGIN
    UPDATE Metadata 
    SET defaultProject = NEW.id
    WHERE id = 1;
END;