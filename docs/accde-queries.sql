
-- ================= ~sq_cfrmAddDeleteAdmin~sq_clstSelectLoan =================
SELECT tblLoan.ProjectName,tblLoan.RelatedLoans,tblLoan.MWLoanNo,tblLoan.Pool,tblLoan.BorrowerNm,tblLoan.PrincipalBalance,tblRelationships.SortNo FROM [tblLoan],[zxTblLOCALCurrentProject],[tblRelationships] ORDER BY tblLoan.BorrowerNm

-- ================= ~sq_cfrmAddDeleteAdmin~sq_ctxtSelectedPool =================
SELECT tblLoan.Pool,tblLoan.ProjectName FROM [zxTblLOCALCurrentProject],[tblLoan] ORDER BY tblLoan.Pool

-- ================= ~sq_cfrmBKSearches~sq_cBKStatus =================
SELECT zBKStatus.BKStatus FROM [zBKStatus]

-- ================= ~sq_cfrmBPOAdmin~sq_cfrmCollateralAdminBPO =================
SELECT CollateralInfo.* FROM [CollateralInfo]

-- ================= ~sq_cfrmBusinessCalls~sq_cfrmSubformBusinessCall =================
SELECT DISTINCTROW  FROM [tblBorrowers] WHERE ((([__ProjectName])=[ProjectName]))

-- ================= ~sq_cfrmBusinessCalls~sq_clstBusinessBorrowerType =================
SELECT RelatedLoans,BorrowerID,ProjectName,BorrName,City,State,IsBusiness FROM [tblborrowers] WHERE RelatedLoans='DBAY-Du-Al Corpor' and ProjectName = 'DebtX.Bayview.March.2008'

-- ================= ~sq_cfrmCollateralAdminBPO~sq_cMWCollateralCode =================
SELECT zCollateralCodes.Code,zCollateralCodes.Class FROM [zCollateralCodes] ORDER BY zCollateralCodes.Class

-- ================= ~sq_cfrmDDReportExport~sq_clstPools =================
SELECT tblPools.rowguid,tblPools.PoolNo,tblPools.Description FROM [tblPools],[zxTblLOCALCurrentProject]

-- ================= ~sq_cfrmDueDiligenceReports~sq_cfrmFilteredMasterRpt-RowSrc =================
SELECT zxtblFilterMasterRpt.ProjectName,zxtblFilterMasterRpt.SortID FROM [zxtblFilterMasterRpt]

-- ================= ~sq_cfrmFinancials~sq_cfrmFinancialCMR =================
SELECT DISTINCTROW  FROM [tblFinancialCMR]

-- ================= ~sq_cfrmFinancials~sq_cfrmFinancialPFS =================
SELECT DISTINCTROW  FROM [tblFinancialPFS]

-- ================= ~sq_cfrmFinancials~sq_ctxtBorrowerName =================
SELECT tblBorrowers.BorrName FROM [tblBorrowers] WHERE (((tblBorrowers.RelatedLoans)=Forms!frmFinancials.txtRelatedLoans) And ((tblBorrowers.BorrowerID)=Forms!frmFinancials.txtBorrowerID))

-- ================= ~sq_cfrmLoanView~sq_cCollateralDetail =================
SELECT CollateralInfo.* FROM [CollateralInfo]

-- ================= ~sq_cfrmLoanView~sq_cfrmBorrowerLookup =================
SELECT tblBorrowerLookup.ProjectName,tblBorrowerLookup.MWLoanNo,tblBorrowerLookup.BorrowerID,tblBorrowerLookup.RelatedLoans,tblBorrowerLookup.BorrowerType,tblBorrowerLookup.BorrName FROM [tblBorrowerLookup] WHERE (((tblBorrowerLookup.ProjectName)=Forms!frmLoanView!ProjectName) And ((tblBorrowerLookup.MWLoanNo)=Forms!frmLoanView!MWLoanNo) And ((tblBorrowerLookup.RelatedLoans)=Forms!frmLoanView!RelatedLoans)) ORDER BY tblBorrowerLookup.BorrowerType

-- ================= ~sq_cfrmLoanView~sq_cFrmCommentsSub =================
SELECT tblcomments.ProjectName,tblcomments.RelatedLoans,tblcomments.MWLoanNo,tblcomments.AcctOfficer,tblcomments.Date,tblcomments.KeyProvision,tblcomments.Group,tblcomments.GroupType,tblcomments.Comment FROM [tblcomments] WHERE (((tblcomments.ProjectName)=Forms!frmLoanView!ProjectName) And ((tblcomments.RelatedLoans)=Forms!frmLoanView!RelatedLoans))

-- ================= ~sq_cfrmLoanView~sq_cfrmObligorSub2 =================
SELECT tblBorrowers.* FROM [tblBorrowers]

-- ================= ~sq_cfrmLoanView~sq_cfrmOverview =================
SELECT tblRelationships.RelationshipOverview,tblRelationships.CollateralOverview,tblRelationships.ConditionsDeadlines FROM [tblRelationships] WHERE (((tblRelationships.ProjectName)=Forms!frmLoanView!ProjectName) And ((tblRelationships.RelatedLoans)=Forms!frmLoanView!RelatedLoans))

-- ================= ~sq_cfrmLoanView~sq_cfrmPayHistSub =================
SELECT tblPayHistory.mwloanno,tblPayHistory.Year,tblPayHistory.Month,tblPayHistory.amount,tblPayHistory.ProjectName,tblPayHistory.RelatedLoans FROM [tblPayHistory] WHERE (((tblPayHistory.mwloanno)=Forms!frmLoanView!MWLoanNo) And ((tblPayHistory.ProjectName)=Forms!frmLoanView!ProjectName) And ((tblPayHistory.RelatedLoans)=Forms!frmLoanView!RelatedLoans)) ORDER BY tblPayHistory.Year

-- ================= ~sq_cfrmLoanView~sq_cfrmRelatedStrategy =================
SELECT tblRelationships.ExitStrategyOverview,tblRelationships.ExitCode,tblRelationships.Original_Strategy FROM [tblRelationships] WHERE (((tblRelationships.RelatedLoans)=Forms!frmLoanView!RelatedLoans) And ((tblRelationships.ProjectName)=Forms!frmLoanView!ProjectName))

-- ================= ~sq_cfrmLoanView~sq_cfrmTasks =================
SELECT DISTINCTROW  FROM [] WHERE ((([__ProjectName])=[ProjectName]) AND (([__RelatedLoans])=[RelatedLoans]))

-- ================= ~sq_cfrmLoanView~sq_cLstCollateral =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,CollateralInfo.Priority,CollateralInfo.MWCollateralCode,CollateralInfo.Description,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.MWPropertyNo,CollateralInfo.SellerAppraisedValue,Max(tblBPO.SubjSalePrice) FROM [CollateralInfo],[tblBPO] ORDER BY CollateralInfo.Priority

-- ================= ~sq_cfrmLoanView~sq_cLstCollateralItems =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,CollateralInfo.Priority,CollateralInfo.MWPropertyNo,CollateralInfo.MWCollateralCode,CollateralInfo.Description,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.SellerAppraisedValue,CollateralInfo.SellerAppraisalDate FROM [CollateralInfo],[tblBPO] ORDER BY CollateralInfo.Priority

-- ================= ~sq_cfrmLoanView~sq_clstCollForPropinfo =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,CollateralInfo.Priority,CollateralInfo.MWCollateralCode,Nz([CollateralInfo]![Address] & " | ","") & Nz([CollateralInfo]![City] & " | ","") & Nz([CollateralInfo]![State] & " | ",""),CollateralInfo.CurrentAppraisedValue,CollateralInfo.CurrentAppraisalDate,CollateralInfo.SQFT,CollateralInfo.NumUnits,CollateralInfo.Condition,CollateralInfo.[CoStar Rents],Format$([CollateralInfo]![CoStar Vac],"Percent"),Format$([CollateralInfo]![CoStar Cap],"Percent") FROM [CollateralInfo] WHERE (((CollateralInfo.ProjectName)=Forms!frmLoanView!ProjectName) And ((CollateralInfo.RelatedLoans)=Forms!frmLoanView!RelatedLoans)) ORDER BY CollateralInfo.Priority

-- ================= ~sq_cfrmLoanView~sq_clstObligors =================
SELECT tblBorrowers.BorrowerID,tblBorrowers.RelatedLoans,tblBorrowers.ProjectName,tblBorrowers.BorrName,tblBorrowers.SSN,tblBorrowers.City,tblBorrowers.State,tblBorrowers.BeaconScore,tblBorrowers.BeaconDate,tblBorrowers.BKStatus FROM [tblBorrowers] WHERE (((tblBorrowers.RelatedLoans)=Forms!frmLoanView!RelatedLoans) And ((tblBorrowers.ProjectName)=Forms!frmLoanView!ProjectName))

-- ================= ~sq_cfrmLoanView~sq_cLstRelatedLoans =================
SELECT tblLoan.ProjectName,tblLoan.RelatedLoans,tblLoan.MWLoanNo,tblLoan.BorrowerNm,Format([OrigPrincipalBalance],'$#,##0'),Format([PrincipalBalance],'$#,##0'),Format([InterestBalance],'$#,##0'),Format([Rate]*100,'Standard'),Format([DefaultRate]*100,'Standard'),Format([RepayAmt],'$#,##0'),Format([DueDt],'mm/dd/yy'),Format([LastPmtDt],'mm/dd/yy'),Format([OrgNoteDate],'mm/dd/yy'),Format([CurrentMaturityDate],'mm/dd/yy') FROM [tblLoan] ORDER BY tblLoan.PrincipalBalance

-- ================= ~sq_cfrmLoanView~sq_cRelatedLoanLookup =================
SELECT tblLoan.RelatedLoans,tblLoan.MWLoanNo,Format(Sum([PrincipalBalance]),'$#,##0'),tblRelationships.SortNo,tblLoan.BorrowerNm FROM [tblLoan],[tblRelationships] ORDER BY tblLoan.BorrowerNm

-- ================= ~sq_cfrmLogin~sq_ccboCurrentProject =================
SELECT tblProjects.ProjectName FROM [tblProjects] ORDER BY [ProjectName]

-- ================= ~sq_cfrmMoveLoan-Admin~sq_ccboTargetRelationship =================
SELECT tblRelationships.RelatedLoans FROM [zxTblLOCALCurrentProject],[tblRelationships] ORDER BY tblRelationships.RelatedLoans

-- ================= ~sq_cfrmProjectionsNew~sq_ccboGroup =================
SELECT DISTINCTROW ztblGroups.Group FROM [ztblGroups]

-- ================= ~sq_cfrmSubformBusinessCall~sq_cBusinessCallResult =================
SELECT zBusCallCodes.CallResult FROM [zBusCallCodes]

-- ================= ~sq_cfrmTaxCall~sq_cfrmTaxCallSub =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RealEstateGroup,CollateralInfo.RelatedLoans,CollateralInfo.Priority,CollateralInfo.MWPropertyNo,CollateralInfo.BorrowerName,CollateralInfo.IsRealEstate,CollateralInfo.Description,CollateralInfo.MWCollateralCode,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.County,CollateralInfo.Zip,CollateralInfo.TaxAnnualAmt,CollateralInfo.TaxAssessedValue,CollateralInfo.TaxMarketValue,CollateralInfo.TaxDelinquentAmt,CollateralInfo.TaxStatementDate,CollateralInfo.TaxParcelIDNO,CollateralInfo.TaxComment,CollateralInfo.TaxCallComplete,CollateralInfo.OwnerName,CollateralInfo.RelatedUPB,CollateralInfo.TaxWebCard FROM [CollateralInfo] WHERE (((CollateralInfo.ProjectName)=Forms!frmMain.txtcurrentproject) And ((CollateralInfo.MWPropertyNo)=Forms!frmTaxCall!List3) And ((CollateralInfo.IsRealEstate)=True)) ORDER BY CollateralInfo.County

-- ================= ~sq_cfrmTitleAdmin~sq_cfrmCollateralAdminTitle =================
SELECT CollateralInfo.* FROM [CollateralInfo]

-- ================= ~sq_cfrmTitleUpdates~sq_cfrmTitleUpdatesSub =================
SELECT tblLiens.ProjectName,tblLiens.RelatedLoans,tblLiens.LienPosition,tblLiens.MWPropertyNo,tblLiens.TitleID,tblLiens.CreditorName,tblLiens.Limit,tblLiens.RecordingDt,tblLiens.LienMatDt,tblLiens.NoneStated,tblLiens.Amount,tblLiens.BalanceDt,tblLiens.InstrumentNo,tblLiens.DocType,tblLiens.CrossCollateral,tblLiens.MWLien,tblLiens.MWLoanNo,tblLiens.UCCExpirDt,tblLiens.UCCContinuationDt,tblLiens.UCCLocation,tblLiens.[Deed No],tblLiens.[Deed Status] FROM [tblLiens] WHERE (((tblLiens.ProjectName)=Forms!frmTitleUpdates.ProjectName) And ((tblLiens.RelatedLoans)=Forms!frmTitleUpdates.RelatedLoans) And ((tblLiens.MWPropertyNo)=Forms!frmTitleUpdates.MWPropertyNo) And ((tblLiens.TitleID)=Forms!frmTitleUpdates.TitleID)) ORDER BY tblLiens.LienPosition

-- ================= ~sq_drptBidConditions-All~sq_drptBidConditionsDeadlinesSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_dPROPERTY STATEMENTS =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptBKSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptBorrowerSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptBusinessCall =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptCollateralOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptCollateralSummary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptCommentSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = MWLoanNo)

-- ================= ~sq_drptDetail-ByPool~sq_drptExitStrategySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptFinancialCMRDetail =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptFinancialsComments-CMR =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_dRptFinancialSummaryCMR =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_dRptFinancialSummaryPFS =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptNonRECollateralPreview =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptObligorDetail-All =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptPayHistoryComment =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByPool~sq_dRptPayHistorySpread =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByPool~sq_drptProjections-Summary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptRelatedPayHist =================
SELECT DISTINCTROW  FROM [QryRelatedPayHist] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptRelationshipOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptTaskSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptTitleDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptBKSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptBPO =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptBusinessCall =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptCommentSub-2 =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptExitStrategySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptLoanDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptProjectionsNew =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptRelatedPayHist =================
SELECT DISTINCTROW  FROM [QryRelatedPayHist] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptTitleDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_dPROPERTY STATEMENTS =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptBidConditionsDeadlinesSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptBorrowerSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptBPO =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptCollateralOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptCollateralReportTest =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptCommentSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptCommentSub-2 =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptFinancialCMRDetail =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptFinancialPFSDetail =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptFinancialsComments-CMR =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_dRptFinancialSummaryPFS =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptLoanDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptObligorDetail-All =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptObligorList-LoanLevel =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship~sq_dRptPayHistorySpread =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptProjections-Summary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptRelatedPayHist =================
SELECT DISTINCTROW  FROM [QryRelatedPayHist] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptRelationshipSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptTaskSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptTitleDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_dPROPERTY STATEMENTS =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptBidConditionsDeadlinesSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptBKSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptBPO =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptBusinessCall =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptCollateralReportTest =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptCollateralSummary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptCommentSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = MWLoanNo)

-- ================= ~sq_drptDetail-Master~sq_drptExitStrategySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptFinancialPFSDetail =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_dRptFinancialSummaryCMR =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_dRptFinancialSummaryPFS =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptNonRECollateralPreview =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptObligorDetail-All =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptPayHistoryComment =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-Master~sq_dRptPayHistorySpread =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-Master~sq_drptProjectionsNew =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-Master~sq_drptRelatedPayHist =================
SELECT DISTINCTROW  FROM [QryRelatedPayHist] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptRelationshipOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptTaskSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptTitleDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptBorrowerSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptCollateralOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptCollateralSummary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_dRptFinancialSummaryCMR =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_dRptFinancialSummaryPFS =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptProjections-Summary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptRelationshipOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptRelationshipSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptPostRollUp-Master~sq_drptPostRollUp-BusinessCallSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptPostRollUp-Master~sq_drptPostRollUp-CommentSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_dChild137 =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_dChild92 =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptBidConditionsDeadlinesSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptPostRollUp-Master~sq_drptPostRollUp-TitleSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptBPO =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptCollateralSummary =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptCommentSub =================
SELECT DISTINCTROW  FROM [] WHERE ((([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)) AND ([__RelatedLoans] = MWLoanNo)

-- ================= ~sq_drptZFilteredMaster~sq_drptFinancialsComments-CMR =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_dRptFinancialSummaryCMR =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptProjections-Summary =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptRelatedPayHist =================
SELECT DISTINCTROW  FROM [QryRelatedPayHist] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptRelationshipOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptTaskSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptTitleDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_ffrmBusinessCalls =================
SELECT tblborrowers.* FROM [tblborrowers] WHERE (((tblborrowers.ProjectName)=Forms!frmMain!txtCurrentProject))

-- ================= ~sq_ffrmCollateralPopup =================
SELECT CollateralInfo.* FROM [CollateralInfo]

-- ================= ~sq_ffrmPoolDetail =================
SELECT tblPools.PoolNo,tblPools.Investor,tblPools.ProjectName,tblPools.Description,tblPools.RollUpDate,tblPools.BidDate,tblPools.PrimaryAssetType,tblPools.PrimaryPerformance,tblPools.PrimaryGeography,tblPools.PrimaryGeogState,tblPools.NoRelationships,tblPools.NoLoans,tblPools.BidderName,tblPools.UPBAmount,tblPools.BidAmount,tblPools.BidPctUPB,tblPools.wAvgBidToYield,tblPools.SaleResult,tblPools.PurchasedUPB,tblPools.PurchasePrice,tblPools.EstHighBid,tblPools.EstCoverBid,tblPools.EstPlacing,tblPools.EstNoBidders,tblPools.BidDescriptionMemo,tblPools.OtherMemo,tblPools.BaseServicingFee,tblPools.Perf_Non_Perf FROM [tblPools]

-- ================= ~sq_ffrmProperty =================
SELECT DISTINCTROW  FROM [tblProperty]

-- ================= ~sq_ffrmPropertyStatements =================
SELECT CollateralInfo.Priority,CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,CollateralInfo.MWPropertyNo,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.County,CollateralInfo.Zip,CollateralInfo.SQFT,CollateralInfo.TaxAnnualAmt,CollateralInfo.TaxDelinquentAmt,CollateralInfo.NumUnits,CollateralInfo.Condition,CollateralInfo.[CoStar Rents],CollateralInfo.[CoStar Vac],CollateralInfo.[CoStar Cap] FROM [CollateralInfo] WHERE (((CollateralInfo.ProjectName)=Forms!frmLoanView!ProjectName) And ((CollateralInfo.RelatedLoans)=Forms!frmLoanView!RelatedLoans) And ((CollateralInfo.MWPropertyNo)=Forms!frmLoanView!txtPropNo))

-- ================= ~sq_ffrmTaxCallSub =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RealEstateGroup,CollateralInfo.RelatedLoans,CollateralInfo.Priority,CollateralInfo.MWPropertyNo,CollateralInfo.BorrowerName,CollateralInfo.IsRealEstate,CollateralInfo.Description,CollateralInfo.MWCollateralCode,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.County,CollateralInfo.Zip,CollateralInfo.TaxAnnualAmt,CollateralInfo.TaxAssessedValue,CollateralInfo.TaxMarketValue,CollateralInfo.TaxDelinquentAmt,CollateralInfo.TaxStatementDate,CollateralInfo.TaxParcelIDNO,CollateralInfo.TaxComment,CollateralInfo.TaxCallComplete,CollateralInfo.OwnerName,CollateralInfo.RelatedUPB,CollateralInfo.TaxWebCard FROM [CollateralInfo] WHERE (((CollateralInfo.ProjectName)=Forms!frmMain.txtcurrentproject) And ((CollateralInfo.MWPropertyNo)=Forms!frmTaxCall!List3) And ((CollateralInfo.IsRealEstate)=True)) ORDER BY CollateralInfo.County

-- ================= ~sq_fxFrmCashFlowParams =================
SELECT DISTINCTROW  FROM [xTblCFparameters]

-- ================= ~sq_rrptBidConditions-All =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.ExitCode,tblRelationships.ConditionsDeadlines FROM [zxTblLOCALCurrentProject],[tblRelationships] ORDER BY tblRelationships.SortNo

-- ================= ~sq_rrptBlankCollateralCodes =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,CollateralInfo.BorrowerName,CollateralInfo.Priority,CollateralInfo.Address,CollateralInfo.Description,CollateralInfo.MWCollateralCode FROM [CollateralInfo]

-- ================= ~sq_rrptBlankFileReview =================
SELECT tblRelationships.ProjectName,tblRelationships.RelatedLoans FROM [tblRelationships],[tblcomments] WHERE (((tblRelationships.ProjectName)=Forms!frmMain.txtcurrentProject) And ((tblcomments.RelatedLoans) Is Null))

-- ================= ~sq_rrptBPOTitleSummarySub =================
SELECT QryCollateralRptSummary.* FROM [QryCollateralRptSummary]

-- ================= ~sq_rrptCommentSub-2 =================
SELECT tblComments.MWLoanNo,tblComments.AcctOfficer,tblComments.Date,tblComments.KeyProvision,tblComments.ProjectName,tblComments.RelatedLoans,tblComments.Group,tblComments.GroupType,tblComments.Comment,ztblCommentGroups.ReportPriority FROM [tblComments],[ztblCommentGroups],[zxTblLOCALCurrentProject] ORDER BY ztblCommentGroups.ReportPriority

-- ================= ~sq_rrptDetail-ByRelationship =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.RelationshipOverview,tblRelationships.CollateralOverview,tblRelationships.ExitStrategyOverview,tblRelationships.ExitCode,tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.PrincipalBalance,tblRelationships.InBankruptcy,tblRelationships.ForeclosureFlag,tblRelationships.LitigationFlag,tblRelationships.ForbearanceFlag,tblRelationships.JudgmentFlag FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan] ORDER BY tblRelationships.SortNo

-- ================= ~sq_rrptDetail-Master =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.RelationshipOverview,tblRelationships.CollateralOverview,tblRelationships.ExitStrategyOverview,tblRelationships.ExitCode,tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.PrincipalBalance,tblRelationships.InBankruptcy,tblRelationships.ForeclosureFlag,tblRelationships.LitigationFlag,tblRelationships.ForbearanceFlag,tblRelationships.JudgmentFlag FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan] ORDER BY tblRelationships.SortNo

-- ================= ~sq_rrptInternalTitle =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,CollateralInfo.State,CollateralInfo.County,CollateralInfo.Zip FROM [CollateralInfo] WHERE (((CollateralInfo.ProjectName)=[Forms]![FrmMain].[txtCurrentProject]))

-- ================= ~sq_rrptPostRollUp-Master =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.ExitCode FROM [zxTblLOCALCurrentProject],[tblRelationships],[qryPostRollUp-Temp] ORDER BY tblRelationships.SortNo

-- ================= ~sq_rrptReviewerPerformance =================
SELECT tblLiens.RelatedLoans,tblLiens.ProjectName,tblLiens.Priority,Count(tblLiens.Confirmed),Count(tblLiens.LienPosition) FROM [tblLiens]

-- ================= aaaBiddingBeaconScoreSummary =================
SELECT tblBorrowers.ProjectName,tblBorrowers.RelatedLoans,Max(tblBorrowers.BeaconScore) FROM [zxTblLOCALCurrentProject],[tblBorrowers]

-- ================= aaaBiddingCollateralPriority =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,CollateralInfo.Priority,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.MWCollateralCode FROM [CollateralInfo],[zqryFirstCollateral]

-- ================= aaaBiddingCollateralValueSummary =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,Count(CollateralInfo.Priority),Sum(maxval(0,([currentappraisedvalue]-maxval(0,[seniorlienamount])-maxval(0,[taxdelinquentamt])))),Sum(maxval(0,(IIf(z_CCodes.Rate Is Null,0.8,z_CCodes.Rate)*[currentappraisedvalue]-maxval(0,[seniorlienamount])-maxval(0,[taxdelinquentamt])))),Sum(CollateralInfo.TaxMarketValue),Sum(CollateralInfo.TaxDelinquentAmt),Sum(CollateralInfo.TaxAnnualAmt),Sum(CollateralInfo.SellerAppraisedValue),Sum(CollateralInfo.CurrentAppraisedValue),aaaBiddingCollateralPriority.Address,aaaBiddingCollateralPriority.City,aaaBiddingCollateralPriority.State,aaaBiddingCollateralPriority.Zip,aaaBiddingCollateralPriority.County,aaaBiddingCollateralPriority.MWCollateralCode FROM [zxTblLOCALCurrentProject],[CollateralInfo],[aaaBiddingCollateralPriority],[z_CCodes]

-- ================= aaaBiddingOverviewSpreadsheet =================
SELECT tblLoan.ProjectName,tblLoan.Pool,tblLoan.MWLoanNo,tblRelationships.SortNo,tblLoan.BorrowerNm,tblLoan.AcctOfficer,tblLoan.RelatedLoans,tblRelationships.ExitCode,tblLoan.OrgNoteDate,tblLoan.CurrentMaturityDate,aaaBiddingBeaconScoreSummary.MaxOfBeaconScore,tblLoan.StCd,tblLoan.PrincipalBalance,tblLoan.InterestBalance,tblLoan.RepayAmt,tblLoan.DueDt,tblLoan.Rate,tblRelationships.InBankruptcy,tblRelationships.ForeclosureFlag,tblRelationships.LitigationFlag,tblRelationships.ForbearanceFlag,tblRelationships.JudgmentFlag,aaaBiddingCollateralValueSummary.CountOfPriority,aaaBiddingCollateralValueSummary.MWCollateralCode,aaaBiddingCollateralValueSummary.State,aaaBiddingCollateralValueSummary.rawliqval,aaaBiddingCollateralValueSummary.adjliqval,aaaBiddingCollateralValueSummary.SumOfTaxMarketValue,aaaBiddingCollateralValueSummary.SumOfSellerAppraisedValue,aaaBiddingCollateralValueSummary.SumOfCurrentAppraisedValue,aaaBiddingCollateralValueSummary.SumOfTaxDelinquentAmt,aaaBiddingCollateralValueSummary.SumOfTaxAnnualAmt,aaaBiddingCollateralValueSummary.Address,aaaBiddingCollateralValueSummary.City,aaaBiddingCollateralValueSummary.Zip,aaaBiddingCollateralValueSummary.County,tblLoan.RateType,tblLoan.AssetType,tblLoan.index,tblLoan.margin,tblLoan.Floor,tblLoan.Ceiling,tblLoan.changefreq,tblLoan.nextchangedt FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan],[aaaBiddingCollateralValueSummary],[aaaBiddingBeaconScoreSummary] ORDER BY tblLoan.ProjectName

-- ================= aaaBIDQUERYREVISED-ALLPOOLS =================
SELECT aaaBiddingOverviewSpreadsheet.ProjectName,aaaBiddingOverviewSpreadsheet.Pool,aaaBiddingOverviewSpreadsheet.MWLoanNo,IIf([sortno] Is Null,999,CDbl([sortno])),aaaBiddingOverviewSpreadsheet.BorrowerNm,aaaBiddingOverviewSpreadsheet.RelatedLoans,aaaBiddingOverviewSpreadsheet.AcctOfficer,aaaBiddingOverviewSpreadsheet.OrgNoteDate,aaaBiddingOverviewSpreadsheet.CurrentMaturityDate,aaaBiddingOverviewSpreadsheet.MaxOfBeaconScore,aaaBiddingOverviewSpreadsheet.StCd,aaaBiddingOverviewSpreadsheet.PrincipalBalance,aaaBiddingOverviewSpreadsheet.InterestBalance,aaaBiddingOverviewSpreadsheet.RepayAmt,aaaBiddingOverviewSpreadsheet.DueDt,aaaBiddingOverviewSpreadsheet.Rate,aaaBiddingOverviewSpreadsheet.InBankruptcy,aaaBiddingOverviewSpreadsheet.ForeclosureFlag,aaaBiddingOverviewSpreadsheet.LitigationFlag,aaaBiddingOverviewSpreadsheet.ForbearanceFlag,aaaBiddingOverviewSpreadsheet.CountOfPriority,aaaBiddingOverviewSpreadsheet.MWCollateralCode,aaaBiddingOverviewSpreadsheet.State,aaaBiddingOverviewSpreadsheet.rawliqval,aaaBiddingOverviewSpreadsheet.adjliqval,aaaBiddingOverviewSpreadsheet.ExitCode,zQryLast12MosPayHistory.*,zQryBudgetOutputtoExcel.*,aaaBiddingOverviewSpreadsheet.SumOfTaxMarketValue,aaaBiddingOverviewSpreadsheet.SumOfSellerAppraisedValue,aaaBiddingOverviewSpreadsheet.SumOfCurrentAppraisedValue,aaaBiddingOverviewSpreadsheet.SumOfTaxDelinquentAmt,aaaBiddingOverviewSpreadsheet.SumOfTaxAnnualAmt,aaaBiddingOverviewSpreadsheet.RateType,aaaBiddingOverviewSpreadsheet.Address,aaaBiddingOverviewSpreadsheet.City,aaaBiddingOverviewSpreadsheet.Zip,aaaBiddingOverviewSpreadsheet.County,aaaBiddingOverviewSpreadsheet.AssetType,aaaBiddingOverviewSpreadsheet.index,aaaBiddingOverviewSpreadsheet.margin,aaaBiddingOverviewSpreadsheet.Floor,aaaBiddingOverviewSpreadsheet.Ceiling,aaaBiddingOverviewSpreadsheet.changefreq,aaaBiddingOverviewSpreadsheet.nextchangedt FROM [zxTblLOCALCurrentProject],[aaaBiddingOverviewSpreadsheet],[zQryBudgetOutputtoExcel],[zQryLast12MosPayHistory] ORDER BY aaaBiddingOverviewSpreadsheet.ProjectName

-- ================= aaaBidSummaryByLoan =================
SELECT tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.BorrowerNm,tblLoan.PrincipalBalance,Sum(0.6*[principalbalance]) FROM [tblLoan]

-- ================= qryAdminBPO-AllOrders =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-Canceled =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-CancellationRpt =================
SELECT CollateralInfo.*,'1BPO',tblBPO.ProjectName,tblBPO.RelatedLoans,tblBPO.MWPropertyNo,tblBPO.BPOBroker,tblBPO.Status,tblBPO.VendorOrderDt,tblBPO.CancelDate,tblBPO.BPOProvider FROM [tblBPO],[CollateralInfo] WHERE (((tblBPO.ProjectName)=Forms!frmBPOAdmin.txtProjectName) And ((tblBPO.Status)="Canceled" Or (tblBPO.Status)="Ordered"))

-- ================= qryAdminBPO-DataOutput =================
SELECT CollateralInfo.RelatedLoans,CollateralInfo.BorrowerName,CollateralInfo.MWPropertyNo,qrytblLoanLinkToCollateral.Pool,Format([RelPrin],'$#,##0'),CollateralInfo.LienPosition,CollateralInfo.TaxMarketValue,CollateralInfo.SellerAppraisedValue,CollateralInfo.SellerAppraisalDate,CollateralInfo.OwnerName,CollateralInfo.Description,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,tblBPO.BPOBroker,tblBPO.BPOProvider,CollateralInfo.TaxDelinquentAmt,CollateralInfo.MWCollateralCode FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-DeletedCollateral =================
SELECT tblBPO.MWPropertyNo & "-" & tblBPO.RelatedLoans & "-" & tblBPO.BPOBroker,tblBPO.Status,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.RealEstateGroup,tblBPO.BPOProvider FROM [CollateralInfo],[tblBPO] WHERE (((tblBPO.Status)='DELETED') And ((tblBPO.ProjectName)="ZZZ" & Forms!frmBPOAdmin.txtProjectName))

-- ================= qryAdminBPO-NotEntered =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-NotOrdered =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-Ordered =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-OrderOutput =================
SELECT CollateralInfo.RelatedLoans & '-' & CollateralInfo.MWPropertyNo & '-' & tblBPO.BPOBroker,CollateralInfo.BorrowerName,CollateralInfo.OwnerName,CollateralInfo.Description,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,tblBPO.BPOProvider,CollateralInfo.MWCollateralCode,CollateralInfo.MWPropertyNo FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral]

-- ================= qryAdminBPO-Received =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-AllOrders =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-AllRE =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate,tblTitle.Source FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-CancellationRpt =================
SELECT CollateralInfo.*,'3Lien',tblTitle.ProjectName,tblTitle.RelatedLoans,tblTitle.MWPropertyNo,tblTitle.Status,tblTitle.OrderDate,tblTitle.CancelDate,tblTitle.TitleVendor,tblTitle.Source FROM [tblTitle],[CollateralInfo] WHERE (((tblTitle.ProjectName)=Forms!frmTitleAdmin.txtCurrentProject) And ((tblTitle.Status)="Ordered") And ((tblTitle.Source)="MWTitle")) Or (((tblTitle.Status)="Canceled"))

-- ================= qryAdminTitle-DataOutput =================
SELECT CollateralInfo.MWPropertyNo,[CollateralInfo].[MWPropertyNo] & '-' & [CollateralInfo].[RelatedLoans],CollateralInfo.BorrowerName,CollateralInfo.OwnerName,CollateralInfo.Description,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.Status,tblTitle.TitleVendor,CollateralInfo.MWCollateralCode FROM [xtblTitleSelected],[CollateralInfo],[tblTitle] WHERE (((tblTitle.Status)='Canceled'))

-- ================= qryAdminTitle-DeletedCollateral =================
SELECT tblTitle.MWPropertyNo & "-" & tblTitle.RelatedLoans,tblTitle.Status,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.RealEstateGroup,tblTitle.TitleVendor FROM [tblTitle],[CollateralInfo] WHERE (((tblTitle.Status)="DELETED") And ((tblTitle.ProjectName)="ZZZ" & Forms!frmTitleAdmin.txtCurrentProject) And ((tblTitle.Source)="MWTitle"))

-- ================= qryAdminTitle-Entered =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral],[xtblTitleSponsor] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-InFile =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate,tblTitle.Source,CollateralInfo.IsRealEstate,qrytblLoanLinkToCollateral.RelPrin FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] WHERE (((tblTitle.Status)="In File") AND ((CollateralInfo.IsRealEstate)=True)) ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-InFileRowSource =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate,tblTitle.Source,CollateralInfo.IsRealEstate,qrytblLoanLinkToCollateral.RelPrin FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] WHERE (((tblTitle.Source)<>"MWTitle") AND ((CollateralInfo.IsRealEstate)=True)) OR (((tblTitle.Source) Is Null) AND ((CollateralInfo.IsRealEstate)=True)) ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-MWandFileRecords =================
SELECT CollateralInfo.MWPropertyNo,qrytblLoanLinkToCollateral.RelatedLoans,CollateralInfo.BorrowerName,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.TitleVendor,CollateralInfo.MWCollateralCode,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),tblTitle.Source,IIf(tblTitle.Source="MWTitle",1,0),IIf(tblTitle.Source<>"MWTitle",1,0) FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] WHERE (((CollateralInfo.IsRealEstate)=True)) ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-MWTitlelRowSource =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate,tblTitle.Source,CollateralInfo.IsRealEstate,qrytblLoanLinkToCollateral.RelPrin FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] WHERE (((tblTitle.Source)="MWTitle") AND ((CollateralInfo.IsRealEstate)=True)) OR (((tblTitle.Source) Is Null) AND ((CollateralInfo.IsRealEstate)=True)) ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-NotEntered =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-NotOrdered =================
SELECT [qryAdminTitle-InFileRowSource].ID,[qryAdminTitle-InFileRowSource].OwnerName,[qryAdminTitle-InFileRowSource].Address,[qryAdminTitle-InFileRowSource].City,[qryAdminTitle-InFileRowSource].State,[qryAdminTitle-InFileRowSource].Zip,[qryAdminTitle-InFileRowSource].County,[qryAdminTitle-InFileRowSource].TaxParcelIDNO,[qryAdminTitle-InFileRowSource].REGroup,[qryAdminTitle-MWTitlelRowSource].Date,[qryAdminTitle-MWTitlelRowSource].Vendor,[qryAdminTitle-MWTitlelRowSource].Status,[qryAdminTitle-InFileRowSource].RelPrincipal,[qryAdminTitle-InFileRowSource].SellValue,[qryAdminTitle-MWTitlelRowSource].Lien,[qryAdminTitle-InFileRowSource].OrderDate FROM [qryAdminTitle-InFileRowSource],[qryAdminTitle-MWTitlelRowSource],[xtblTitleSponsor] ORDER BY [qryAdminTitle-InFileRowSource].RelPrin DESCENDING

-- ================= qryAdminTitle-Online =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral],[xtblTitleSponsor] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-Pending =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-Received =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= QryCollateralRptSummary =================
SELECT DISTINCT  FROM [],[]

-- ================= qryCollateralRptSummary2 =================
SELECT DISTINCT  FROM [],[]

-- ================= qryDef-SortNoCalcResults =================
SELECT tblRelationships.ProjectName,tblLoan.Pool,tblRelationships.RelatedLoans,qryPoolLevelCalculations.SumOfUPB,Sum(tblLoan.PrincipalBalance),tblRelationships.SortNo FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan],[qryPoolLevelCalculations] ORDER BY tblLoan.Pool

-- ================= qryDetail-ByRelationship_ExportCopy =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.RelationshipOverview,tblRelationships.CollateralOverview,tblRelationships.ExitStrategyOverview,tblRelationships.ExitCode,tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.PrincipalBalance,tblRelationships.InBankruptcy,tblRelationships.ForeclosureFlag,tblRelationships.LitigationFlag,tblRelationships.ForbearanceFlag,tblRelationships.JudgmentFlag FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan] ORDER BY tblRelationships.SortNo

-- ================= qrylstCFSummaryRowSrc =================
SELECT tblLoan.ProjectName,tblLoan.RelatedLoans,tblLoan.MWLoanNo,tblLoan.BorrowerNm,tblLoan.PrincipalBalance,Sum(IIf([sect]="income",[Amount],-[amount])) FROM [tblProjections],[tblLoan]

-- ================= QryPayHistorySpread =================
SELECT tblLoan.MWLoanNo,tblPayHistory.ProjectName,tblPayHistory.RelatedLoans,tblLoan.Pool,tblPayHistory.Year,Sum(IIf([month]=1,[amount],0)),Sum(IIf([month]=2,[amount],0)),Sum(IIf([month]=3,[amount],0)),Sum(IIf([month]=4,[amount],0)),Sum(IIf([month]=5,[amount],0)),Sum(IIf([month]=6,[amount],0)),Sum(IIf([month]=7,[amount],0)),Sum(IIf([month]=8,[amount],0)),Sum(IIf([month]=9,[amount],0)),Sum(IIf([month]=10,[amount],0)),Sum(IIf([month]=11,[amount],0)),Sum(IIf([month]=12,[amount],0)),Sum(tblPayHistory.amount) FROM [tblPayHistory],[tblLoan]

-- ================= qryPoolLevelCalculations-NumRel =================
SELECT tblRelationships.ProjectName,tblRelationships.RelatedLoans,tblLoan.Pool FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan]

-- ================= qryPostRollUp-Temp =================
SELECT tblRelationships.RelatedLoans,tblTitle.LastModifiedDate,tblBPO.LastModifiedDate,tblcomments.LastModifiedDate,tblBorrowers.BusinessCallDT FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblcomments],[tblTitle],[tblBPO],[tblBorrowers]

-- ================= qryProjectionsSummary-ByRelationship =================
SELECT zqryASRReportCurrentLoanERCUnion.ProjectName,zqryASRReportCurrentLoanERCUnion.RelatedLoans,ztblGroups.Description,ztblGroups.GSortOrder,ztblClasses.SortOrder,zqryASRReportCurrentLoanERCUnion.Group,zqryASRReportCurrentLoanERCUnion.Sect,zqryASRReportCurrentLoanERCUnion.Year,Sum(zqryASRReportCurrentLoanERCUnion.m1),Sum(zqryASRReportCurrentLoanERCUnion.m2),Sum(zqryASRReportCurrentLoanERCUnion.m3),Sum(zqryASRReportCurrentLoanERCUnion.m4),Sum(zqryASRReportCurrentLoanERCUnion.m5),Sum(zqryASRReportCurrentLoanERCUnion.m6),Sum(zqryASRReportCurrentLoanERCUnion.m7),Sum(zqryASRReportCurrentLoanERCUnion.m8),Sum(zqryASRReportCurrentLoanERCUnion.m9),Sum(zqryASRReportCurrentLoanERCUnion.m10),Sum(zqryASRReportCurrentLoanERCUnion.m11),Sum(zqryASRReportCurrentLoanERCUnion.m12) FROM [ztblGroups],[zqryASRReportCurrentLoanERCUnion],[ztblClasses]

-- ================= qryProjReport =================
SELECT zqryASRReportCurrentLoanERCUnion.ProjectName,zqryASRReportCurrentLoanERCUnion.RelatedLoans,zqryASRReportCurrentLoanERCUnion.LoanNo,ztblGroups.Description,ztblGroups.GSortOrder,ztblClasses.SortOrder,zqryASRReportCurrentLoanERCUnion.Group,zqryASRReportCurrentLoanERCUnion.Sect,zqryASRReportCurrentLoanERCUnion.Year,zqryASRReportCurrentLoanERCUnion.m1,zqryASRReportCurrentLoanERCUnion.m2,zqryASRReportCurrentLoanERCUnion.m3,zqryASRReportCurrentLoanERCUnion.m4,zqryASRReportCurrentLoanERCUnion.m5,zqryASRReportCurrentLoanERCUnion.m6,zqryASRReportCurrentLoanERCUnion.m7,zqryASRReportCurrentLoanERCUnion.m8,zqryASRReportCurrentLoanERCUnion.m9,zqryASRReportCurrentLoanERCUnion.m10,zqryASRReportCurrentLoanERCUnion.m11,zqryASRReportCurrentLoanERCUnion.m12 FROM [ztblGroups],[zqryASRReportCurrentLoanERCUnion],[ztblClasses]

-- ================= QryRelatedPayHist =================
SELECT vwPayHistorySpread.ProjectName,vwPayHistorySpread.RelatedLoans,vwPayHistorySpread.Pool,vwPayHistorySpread.Year,Sum(vwPayHistorySpread.PHJan),Sum(vwPayHistorySpread.PHFeb),Sum(vwPayHistorySpread.PHMar),Sum(vwPayHistorySpread.PHApr),Sum(vwPayHistorySpread.PHMay),Sum(vwPayHistorySpread.PHJun),Sum(vwPayHistorySpread.PHJul),Sum(vwPayHistorySpread.PHAug),Sum(vwPayHistorySpread.PHSep),Sum(vwPayHistorySpread.PHOct),Sum(vwPayHistorySpread.PHNov),Sum(vwPayHistorySpread.PHDec),Sum(vwPayHistorySpread.SumOfAmount) FROM [vwPayHistorySpread]

-- ================= qryTaxAnalysis-Output =================
SELECT qrytblLoanLinkToCollateral.SortNo,qrytblLoanLinkToCollateral.Pool,qrytblLoanLinkToCollateral.RelatedLoans,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.MWCollateralCode,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.TaxAnnualAmt,CollateralInfo.TaxAssessedValue,CollateralInfo.TaxMarketValue,CollateralInfo.TaxDelinquentAmt,CollateralInfo.LienPosition,CollateralInfo.MWTitleLienPosition,CollateralInfo.SeniorLienAmount,CollateralInfo.MWTitleSrLienAmt,CollateralInfo.SellerAppraisedValue,CollateralInfo.SellerAppraisalDate,CollateralInfo.CurrentAppraisedValue,CollateralInfo.SQFT,CollateralInfo.Acreage,CollateralInfo.NumUnits,CollateralInfo.Latitude,CollateralInfo.Longitude,CollateralInfo.PropertyComment,CollateralInfo.LoanNo,CollateralInfo.MWPropertyNo FROM [zxTblLOCALCurrentProject],[CollateralInfo],[qrytblLoanLinkToCollateral] WHERE (((CollateralInfo.IsRealEstate)=True)) ORDER BY qrytblLoanLinkToCollateral.SortNo

-- ================= qrytblLoanLinkToCollateral =================
SELECT tblLoan.ProjectName,tblLoan.RelatedLoans,tblLoan.Pool,tblRelationships.SortNo,Sum(tblLoan.PrincipalBalance),Count(tblLoan.MWLoanNo),Sum(tblLoan.InterestBalance) FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan]

-- ================= qryUDFFinancialCMRDetail =================
SELECT  FROM

-- ================= rptDetail-ByRelationship_ExportCopy =================
SELECT  FROM

-- ================= zQryASRReportCurrentLoanERC =================
SELECT tblProjections.ProjectName,tblProjections.RelatedLoans,tblProjections.LoanNo,tblProjections.Group,tblProjections.Sect,tblProjections.Year,Sum(IIf([month]=1,[amount],0)),Sum(IIf([month]=2,[amount],0)),Sum(IIf([month]=3,[amount],0)),Sum(IIf([month]=4,[amount],0)),Sum(IIf([month]=5,[amount],0)),Sum(IIf([month]=6,[amount],0)),Sum(IIf([month]=7,[amount],0)),Sum(IIf([month]=8,[amount],0)),Sum(IIf([month]=9,[amount],0)),Sum(IIf([month]=10,[amount],0)),Sum(IIf([month]=11,[amount],0)),Sum(IIf([month]=12,[amount],0)) FROM [tblProjections] ORDER BY tblProjections.Year

-- ================= zqryASRReportCurrentLoanERCSum =================
SELECT tblProjections.ProjectName,tblProjections.RelatedLoans,tblProjections.LoanNo,tblProjections.Group,"Net",tblProjections.Year,Sum(IIf([month]=1,IIf([sect]="income",[amount],-[amount]),0)),Sum(IIf([month]=2,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=3,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=4,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=5,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=6,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=7,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=8,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=9,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=10,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=11,IIf(sect="income",[amount],-amount),0)),Sum(IIf([month]=12,IIf(sect="income",[amount],-amount),0)) FROM [tblProjections] ORDER BY tblProjections.Year

-- ================= zqryASRReportCurrentLoanERCUnion =================
SELECT DISTINCT  FROM [],[]

-- ================= zQryBudgetOutputtoExcel =================
SELECT tblLoan.MWLoanNo,zqryBudgetSpreadSheetOutput.* FROM [zxTblLOCALCurrentProject],[tblLoan],[zqryBudgetSpreadSheetOutput] ORDER BY tblLoan.Pool

-- ================= zqryBudgetSpreadSheetOutput =================
SELECT tblLoan.MWLoanNo,[year] & "/" & IIf([month]<10,"0" & [month],[month]),Sum(IIf([sect]="income",[amount],-[amount])) FROM [zxTblLOCALCurrentProject],[tblLoan],[tblProjections] WHERE (((tblProjections.Group)="duedil")) ORDER BY tblLoan.MWLoanNo

-- ================= zQryCurrentLoanERCExpense =================
SELECT zQryCurrentLoanERC.RelatedLoans,zQryCurrentLoanERC.ProjectName,zQryCurrentLoanERC.LoanNo,zQryCurrentLoanERC.Year,Sum(IIf([month]=1,[amount],0)),Sum(IIf([month]=2,[amount],0)),Sum(IIf([month]=3,[amount],0)),Sum(IIf([month]=4,[amount],0)),Sum(IIf([month]=5,[amount],0)),Sum(IIf([month]=6,[amount],0)),Sum(IIf([month]=7,[amount],0)),Sum(IIf([month]=8,[amount],0)),Sum(IIf([month]=9,[amount],0)),Sum(IIf([month]=10,[amount],0)),Sum(IIf([month]=11,[amount],0)),Sum(IIf([month]=12,[amount],0)),Sum(zQryCurrentLoanERC.Amount) FROM [zQryCurrentLoanERC]

-- ================= zQryCurrentLoanERCIncome =================
SELECT zQryCurrentLoanERC.ProjectName,zQryCurrentLoanERC.RelatedLoans,zQryCurrentLoanERC.LoanNo,zQryCurrentLoanERC.Year,Sum(IIf([month]=1,[amount],0)),Sum(IIf([month]=2,[amount],0)),Sum(IIf([month]=3,[amount],0)),Sum(IIf([month]=4,[amount],0)),Sum(IIf([month]=5,[amount],0)),Sum(IIf([month]=6,[amount],0)),Sum(IIf([month]=7,[amount],0)),Sum(IIf([month]=8,[amount],0)),Sum(IIf([month]=9,[amount],0)),Sum(IIf([month]=10,[amount],0)),Sum(IIf([month]=11,[amount],0)),Sum(IIf([month]=12,[amount],0)),Sum(zQryCurrentLoanERC.Amount) FROM [zQryCurrentLoanERC]

-- ================= zqryCurrentLoanERCSummary =================
SELECT zQryCurrentLoanERC.ProjectName,zQryCurrentLoanERC.RelatedLoans,zQryCurrentLoanERC.LoanNo,zQryCurrentLoanERC.Group,Sum(IIf([sect]="income",[Amount],-[amount])) FROM [zQryCurrentLoanERC]

-- ================= zQryCurrentLoanERCTotal =================
SELECT zQryCurrentLoanERC.Year,Sum(IIf([month]=1,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=2,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=3,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=4,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=5,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=6,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=7,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=8,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=9,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=10,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=11,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([month]=12,IIf([sect]="Income",[amount],-[amount]),0)),Sum(IIf([sect]="Income",[Amount],-[amount])) FROM [zQryCurrentLoanERC]

-- ================= zQryLast12MosPayHistory =================
SELECT zxTblLOCALCurrentProject.CurrentProject,tblLoan.RelatedLoans,tblLoan.MWLoanNo,tblPayHistory.pd,Sum(IIf([amount] Is Not Null,[amount],0)) FROM [zxTblLOCALCurrentProject],[tblLoan],[tblPayHistory] WHERE (((tblPayHistory.pd)>=IIf(Month([lastimport])>3,(Year([lastimport])-1)*100+Month([lastimport])-3,(Year([lastimport])-2)*100+Month([lastimport])+9))) ORDER BY tblLoan.MWLoanNo

-- ================= zqrySummitImport1Subject =================
SELECT "Entered",#4/7/2010#,#5/5/2010#,aaBPO.[Subject Address],aaBPO.[Suject City],aaBPO.[Subject State],aaBPO.[Subject County],aaBPO.[Subject Zip Code],aaBPO.[Subject Bedrooms],aaBPO.[Subject Full Baths]+(aaBPO.[Subject Half Baths]*2),aaBPO.[Subject Condition],aaBPO.[Subject GLA],aaBPO.[Subject Property Type],aaBPO.[Subject Lot Size]*1,aaBPO.[Subject Year Built],aaBPO.[Fair Market Value],aaBPO.[REO Value],aaBPO.[FMV List Price],aaBPO.[Property Currently Listed],aaBPO.[Current Final List Price],aaBPO.[Neighborhood Trend],aaBPO.[Typical Market Time] FROM [tblBPO],[aaBPO]

-- ================= zqrySummitImport2SaleComps =================
SELECT aaBPO.[Sale1 Address],aaBPO.[Sale1 City],aaBPO.[Sale1 State],aaBPO.[Sale1 Zip],aaBPO.[Sale2 Address],aaBPO.[Sale2 City],aaBPO.[Sale2 State],aaBPO.[Sale2 Zip],aaBPO.[Sale3 Address],aaBPO.[Sale3 City],aaBPO.[Sale3 State],aaBPO.[Sale3 Zip],aaBPO.[Sale1 Distance to Subject],aaBPO.[Sale1 of Units],aaBPO.[Sale1 Bedrooms],aaBPO.[Sale1 Full Bathrooms],aaBPO.[Sale1 Property Type],aaBPO.[Sale1 Sq Ft above Grade],aaBPO.[Sale1 Lot Size],aaBPO.[Sale1 Year Built],aaBPO.[Sale1 Condition],aaBPO.[Sale1 Days on Market],aaBPO.[Sale1 Last List Price],aaBPO.[Sale1 Sale Price],aaBPO.[Sale1 Sale Date],aaBPO.[Sale2 Distance to Subject],aaBPO.[Sale2 of Units],aaBPO.[Sale2 Bedrooms],aaBPO.[Sale2 Full Bathrooms],aaBPO.[Sale2 Property Type],aaBPO.[Sale2 Sq Ft above Grade],aaBPO.[Sale2 Lot Size],aaBPO.[Sale2 Year Built],aaBPO.[Sale2 Condition],aaBPO.[Sale2 Days on Market],aaBPO.[Sale2 Last List Price],aaBPO.[Sale2 Sale Price],aaBPO.[Sale2 Sale Date],aaBPO.[Sale3 Distance to Subject],aaBPO.[Sale3 of Units],aaBPO.[Sale3 Bedrooms],aaBPO.[Sale3 Full Bathrooms],aaBPO.[Sale3 Property Type],aaBPO.[Sale3 Sq Ft above Grade],aaBPO.[Sale3 Lot Size],aaBPO.[Sale3 Year Built],aaBPO.[Sale3 Condition],aaBPO.[Sale3 Days on Market],aaBPO.[Sale3 Last List Price],aaBPO.[Sale3 Sale Price],aaBPO.[Sale3 Sale Date] FROM [tblBPO],[aaBPO]

-- ================= ZZZQryBPORunImport-Part1 =================
SELECT "Entered",zzzBPOImport.BPODate,zzzBPOImport.BPOOrderNum,zzzBPOImport.BPODate,zzzBPOImport.Address,zzzBPOImport.City,zzzBPOImport.State,zzzBPOImport.County,zzzBPOImport.ZIP,zzzBPOImport.ParcelNum,zzzBPOImport.SubjUnits,zzzBPOImport.SubjBr,zzzBPOImport.SubjBa,zzzBPOImport.SubjCond,zzzBPOImport.SubjDOM,zzzBPOImport.SubjBldgArea,zzzBPOImport.SubjUse,zzzBPOImport.SubjLandArea,zzzBPOImport.SubjYrBuilt,zzzBPOImport.SubjOccup,zzzBPOImport.SubjSalePrice,zzzBPOImport.SubjIsListed,zzzBPOImport.SubjIsListedForPrice,zzzBPOImport.SubjRentSF,zzzBPOImport.MktVacancyRate,zzzBPOImport.MktType,zzzBPOImport.MktDOM,zzzBPOImport.MktValues,zzzBPOImport.MktTime,zzzBPOImport.Sale1Distance,zzzBPOImport.Sale1Units,zzzBPOImport.Sale1Br,zzzBPOImport.Sale1Ba,zzzBPOImport.Sale1Use,zzzBPOImport.Sale1BldgSize,zzzBPOImport.Sale1LandAc,zzzBPOImport.Sale1YrBuilt,zzzBPOImport.Sale1Cond,zzzBPOImport.Sale1DOM,zzzBPOImport.Sale1List,zzzBPOImport.Sale1Sale,zzzBPOImport.Sale1SaleDt,zzzBPOImport.Sale2Distance,zzzBPOImport.Sale2Units,zzzBPOImport.Sale2Br,zzzBPOImport.Sale2Ba,zzzBPOImport.Sale2Use,zzzBPOImport.Sale2BldgSize,zzzBPOImport.Sale2LandAc,zzzBPOImport.Sale2YrBuilt,zzzBPOImport.Sale2Cond,zzzBPOImport.Sale2DOM,zzzBPOImport.Sale2List,zzzBPOImport.Sale2Sale,zzzBPOImport.Sale2SaleDt,zzzBPOImport.Sale3Distance,zzzBPOImport.Sale3Units,zzzBPOImport.Sale3Br,zzzBPOImport.Sale3Ba,zzzBPOImport.Sale3Use,zzzBPOImport.Sale3BldgSize,zzzBPOImport.Sale3LandAc,zzzBPOImport.Sale3YrBuilt,zzzBPOImport.Sale3Cond,zzzBPOImport.Sale3DOM,zzzBPOImport.Sale3List,zzzBPOImport.Sale3Sale,zzzBPOImport.Sale3SaleDt FROM [tblBPO],[zzzBPOImport]

-- ================= ZZZQryBPORunImport-Part2 =================
SELECT zzzBPOImport.List1Distance,zzzBPOImport.List1Units,zzzBPOImport.List1Br,zzzBPOImport.List1Ba,zzzBPOImport.List1Use,zzzBPOImport.List1BldgSize,zzzBPOImport.List1LandAc,zzzBPOImport.List1YrBuilt,zzzBPOImport.List1Cond,zzzBPOImport.List1DOM,zzzBPOImport.List1List,zzzBPOImport.List2Distance,zzzBPOImport.List2Units,zzzBPOImport.List2Br,zzzBPOImport.List2Ba,zzzBPOImport.List2Use,zzzBPOImport.List2BldgSize,zzzBPOImport.List2LandAc,zzzBPOImport.List2YrBuilt,zzzBPOImport.List2Cond,zzzBPOImport.List2DOM,zzzBPOImport.List2List,zzzBPOImport.List3Distance,zzzBPOImport.List3Units,zzzBPOImport.List3Br,zzzBPOImport.List3Ba,zzzBPOImport.List3Use,zzzBPOImport.List3BldgSize,zzzBPOImport.List3LandAc,zzzBPOImport.List3YrBuilt,zzzBPOImport.List3Cond,zzzBPOImport.List3DOM,zzzBPOImport.List3List,zzzBPOImport.Sale1Address,zzzBPOImport.Sale1City,zzzBPOImport.Sale1State,zzzBPOImport.Sale1Zip,zzzBPOImport.Sale2Address,zzzBPOImport.Sale2City,zzzBPOImport.Sale2State,zzzBPOImport.Sale2Zip,zzzBPOImport.Sale3Address,zzzBPOImport.Sale3City,zzzBPOImport.Sale3State,zzzBPOImport.Sale3Zip,zzzBPOImport.List1Address,zzzBPOImport.List1City,zzzBPOImport.List1State,zzzBPOImport.List1Zip,zzzBPOImport.List2Address,zzzBPOImport.List2City,zzzBPOImport.List2State,zzzBPOImport.List2Zip,zzzBPOImport.List3Address,zzzBPOImport.List3City,zzzBPOImport.List3State,zzzBPOImport.List3Zip,zzzBPOImport.BPOAgency,zzzBPOImport.BPOPhone,zzzBPOImport.OverallComment & Chr(13) & Chr(10) & Chr(13) & Chr(10) & zzzBPOImport.LST1Comment & Chr(13) & Chr(10) & zzzBPOImport.LST2Comment & Chr(13) & Chr(10) & zzzBPOImport.LST3Comment & Chr(13) & Chr(10) & zzzBPOImport.SAL1Comment & Chr(13) & Chr(10) & zzzBPOImport.SAL2Comment & Chr(13) & Chr(10) & zzzBPOImport.SAL3Comment & Chr(13) & Chr(10) & Chr(13) & Chr(10) & zzzBPOImport.MarketComment FROM [tblBPO],[zzzBPOImport]

-- ================= ZZZQryBPOUpdateKeyFields =================
SELECT ZZZQryBPOImportID.RelatedLoans,ZZZQryBPOImportID.MWPropertyNo,ZZZQryBPOImportID.BPOBroker FROM [zzzBPOImport],[ZZZQryBPOImportID]

-- ================= ~sq_cfrmBusinessCalls~sq_cLstBusinessBorrowers =================
SELECT tblBorrowers.BorrowerID,tblBorrowers.ProjectName,tblBorrowers.RelatedLoans,tblBorrowers.BorrName,tblBorrowers.SSN,tblBorrowers.City,tblBorrowers.State,tblBorrowers.IsBusiness,tblBorrowers.BusinessCallCompleted FROM [tblBorrowers] WHERE (((tblBorrowers.ProjectName)=Forms!frmMain!txtCurrentProject) And ((tblBorrowers.IsBusiness)=True)) ORDER BY tblBorrowers.BorrName

-- ================= ~sq_cfrmCollateralPopup~sq_cMWCollateralCode =================
SELECT zCollateralCodes.Code,zCollateralCodes.Class FROM [zCollateralCodes] ORDER BY zCollateralCodes.Class

-- ================= ~sq_cfrmDueDiligenceReports~sq_ctxtPools =================
SELECT tblPools.PoolNo FROM [tblPools],[zxTblLOCALCurrentProject]

-- ================= ~sq_cfrmLoanView~sq_cCommentFilter =================
SELECT ztblCommentGroups.GroupName FROM [ztblCommentGroups]

-- ================= ~sq_cfrmLoanView~sq_cfrmLoanDetail =================
SELECT tblLoan.* FROM [tblLoan],[tblRelationships] WHERE (((tblLoan.ProjectName)=Forms.frmLoanView.ProjectName) And ((tblLoan.MWLoanNo)=Forms.frmLoanView.MWLoanNo) And ((tblLoan.RelatedLoans)=Forms.frmLoanView.RelatedLoans))

-- ================= ~sq_cfrmLoanView~sq_cLstPayHistorySpreadSub =================
SELECT QryPayHistorySpread.MWLoanNo,QryPayHistorySpread.year,Format([PHJan],'$#,##0'),Format([PHFeb],'$#,##0'),Format([PHMar],'$#,##0'),Format([PHApr],'$#,##0'),Format([PHMay],'$#,##0'),Format([PHJun],'$#,##0'),Format([PHJul],'$#,##0'),Format([PHAug],'$#,##0'),Format([PHSep],'$#,##0'),Format([PHOct],'$#,##0'),Format([PHNov],'$#,##0'),Format([PHDec],'$#,##0'),Format([SumOfamount],'$#,##0') FROM [QryPayHistorySpread] WHERE (((QryPayHistorySpread.MWLoanNo)=[Forms]![frmLoanView]![MWLoanNo])) ORDER BY QryPayHistorySpread.MWLoanNo

-- ================= ~sq_cfrmLoanView~sq_ctxtSource =================
SELECT xtblTitleSponsor.TitleType FROM [xtblTitleSponsor] ORDER BY xtblTitleSponsor.SortOrder

-- ================= ~sq_cfrmMoveLoan-Admin~sq_clstMoveThisLoan =================
SELECT tblLoan.ProjectName,tblLoan.Pool,tblLoan.RelatedLoans,tblLoan.MWLoanNo,tblLoan.PrincipalBalance,tblLoan.BorrowerNm FROM [zxTblLOCALCurrentProject],[tblLoan] ORDER BY tblLoan.Pool

-- ================= ~sq_cfrmProjectionsNew~sq_clstERCSummary =================
SELECT DISTINCTROW zqryCurrentLoanERCSummary.Group,zqryCurrentLoanERCSummary.total FROM [zqryCurrentLoanERCSummary]

-- ================= ~sq_cfrmTitleUpdates~sq_cSource =================
SELECT xtblTitleSponsor.TitleType FROM [xtblTitleSponsor]

-- ================= ~sq_drptDetail-ByPool~sq_drptBidConditionsDeadlinesSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptBPO =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_cfrmLoanView~sq_clstDocuments =================
SELECT xtblDocuments.FileName,xtblDocuments.FileDescription,xtblDocuments.FileType,xtblDocuments.FileDate,xtblDocuments.FilePath FROM [xtblDocuments]

-- ================= ~sq_drptDetail-ByPool~sq_drptCollateralReportTest =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptCommentSub-2 =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByPool~sq_drptFinancialPFSDetail =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByPool~sq_drptLoanDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByPool~sq_drptObligorList-LoanLevel =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByPool~sq_drptProjectionsNew =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByPool~sq_drptRelationshipSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_dPROPERTY STATEMENTS =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptCommentSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_dRptPayHistorySpread =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship_ExportCopy~sq_drptTaskSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptBKSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptBusinessCall =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptCollateralSummary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptExitStrategySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_dRptFinancialSummaryCMR =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptNonRECollateralPreview =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptProjectionsNew =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-ByRelationship~sq_drptRelationshipOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_dptFinancialCMRDetail =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptBorrowerSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptCollateralOverviewSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptCommentSub-2 =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-Master~sq_drptFinancialsComments-CMR =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptLoanDetailSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-Master~sq_drptObligorList-LoanLevel =================
SELECT DISTINCTROW  FROM [] WHERE (([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptDetail-Master~sq_drptProjections-Summary =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-Master~sq_drptRelationshipSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptBidConditionsDeadlinesSub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptExitStrategySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptDetail-MasterGARversion~sq_drptRelatedPayHist =================
SELECT DISTINCTROW  FROM [QryRelatedPayHist] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptPostRollUp-Master~sq_drptPostRollUp-BPOSub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_dChild136 =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_dChild142 =================
SELECT DISTINCTROW  FROM [] WHERE ((([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)) AND ([__MWLoanNo] = MWLoanNo)

-- ================= ~sq_drptZFilteredMaster~sq_drptBorrowerSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptFinancialPFSDetail =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_dRptFinancialSummaryPFS =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_drptZFilteredMaster~sq_drptRelationshipSummarySub =================
SELECT DISTINCTROW  FROM [] WHERE (([__ProjectName] = ProjectName)) AND ([__RelatedLoans] = RelatedLoans)

-- ================= ~sq_ffrmCollateralAdminBPO =================
SELECT CollateralInfo.* FROM [CollateralInfo]

-- ================= ~sq_ffrmProjectDetail =================
SELECT tblProjects.ProjectName,tblProjects.RollUpDate,tblProjects.ExpectedBidDate,tblProjects.PayHistoryDate,tblProjects.Seller,tblProjects.Broker,tblProjects.ProjComments FROM [zxTblLOCALCurrentProject],[tblProjects]

-- ================= ~sq_ffrmSubformBusinessCall =================
SELECT DISTINCTROW  FROM [tblBorrowers]

-- ================= ~sq_ffrmTitleUpdates =================
SELECT tblTitle.TitleID,tblTitle.Priority,tblTitle.MWPropertyNo,tblTitle.ProjectName,tblTitle.RelatedLoans,tblTitle.Source,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.VendorNo,tblTitle.OrderDate,tblTitle.DeliveryDate,tblTitle.CancelDate,tblTitle.Status,tblTitle.FollowUp,tblTitle.OwnerName,tblTitle.DeedDate,tblTitle.DeedType,tblTitle.RecCounty,tblTitle.ParcelNum,tblTitle.DelqTaxes,tblTitle.MarkedIncomplete,tblTitle.TitleComment,tblTitle.AdminNotes,tblTitle.Confirmed,tblTitle.LastModifiedDate,tblTitle.Registry,tblTitle.[Registration Status] FROM [tblTitle]

-- ================= ~sq_rrptBlankBestLien =================
SELECT tblLiens.RelatedLoans,tblLiens.ProjectName,tblLiens.Priority,Count(tblLiens.Confirmed),Count(tblLiens.LienPosition) FROM [tblLiens]

-- ================= ~sq_rrptBlankExitCodes =================
SELECT tblLoan.MWLoanNo,tblLoan.ProjectName,tblLoan.RelatedLoans,tblLoan.Pool,tblLoan.BorrowerNm,tblLoan.PrincipalBalance,tblLoan.ExitCode FROM [tblLoan] ORDER BY tblLoan.PrincipalBalance

-- ================= ~sq_rrptCommentSub =================
SELECT tblComments.MWLoanNo,tblComments.AcctOfficer,tblComments.Date,tblComments.KeyProvision,tblComments.ProjectName,tblComments.RelatedLoans,tblComments.Group,tblComments.GroupType,tblComments.Comment,ztblCommentGroups.ReportPriority FROM [tblComments],[ztblCommentGroups],[zxTblLOCALCurrentProject] WHERE (((tblComments.MWLoanNo)=[tblComments].[RelatedLoans])) ORDER BY ztblCommentGroups.ReportPriority

-- ================= ~sq_rrptDetail-ByPool =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.RelationshipOverview,tblRelationships.CollateralOverview,tblRelationships.ExitStrategyOverview,tblRelationships.ExitCode,tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.PrincipalBalance,tblRelationships.InBankruptcy,tblRelationships.ForeclosureFlag,tblRelationships.LitigationFlag,tblRelationships.ForbearanceFlag,tblRelationships.JudgmentFlag FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan] ORDER BY tblRelationships.SortNo

-- ================= ~sq_rrptDetail-MasterGARversion =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.RelationshipOverview,tblRelationships.CollateralOverview,tblRelationships.ExitStrategyOverview,tblRelationships.ExitCode,tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.PrincipalBalance,tblRelationships.InBankruptcy,tblRelationships.ForeclosureFlag,tblRelationships.LitigationFlag,tblRelationships.ForbearanceFlag,tblRelationships.JudgmentFlag FROM [zxTblLOCALCurrentProject],[tblRelationships],[tblLoan] ORDER BY tblRelationships.SortNo

-- ================= ~sq_rrptLienSummarySub =================
SELECT tblLiens.ProjectName,tblLiens.MWLoanNo,tblLiens.RelatedLoans,tblLiens.Priority,tblLiens.Amount,tblLiens.Limit,tblLiens.LienPosition,tblLiens.CrossCollateral FROM [tblLiens] ORDER BY tblLiens.LienPosition

-- ================= ~sq_rrptTasksByProject =================
SELECT tblTasks.* FROM [tblTasks],[zxTblLOCALCurrentProject]

-- ================= aaaBidReviewBreakdown =================
SELECT tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.CreditScore,tblLoan.BorrowerNm,tblLoan.PrincipalBalance,tblLoan.DueDt,tblLoan.CurrentMaturityDate,tblLoan.RepayAmt,[zzBidCalculation-Dynamic].numpds,[zzBidCalculation-Dynamic].balloon,zzDueDilColVal.colliqval,zzDueDilColVal.adjliqval,IIf(aaaqryReviewedloans.mwloanno Is Null,"No","Yes"),[zzBidCalculation-Dynamic].bidvalue,tblloan.principalbalance/[adjliqval],[bidvalue]/[adjliqval] FROM [tblLoan],[aaaqryReviewedLoans],[zzBidCalculation-Dynamic],[zzDueDilColVal] WHERE (((tblLoan.Pool)="122")) ORDER BY tblLoan.Pool

-- ================= qryAdminBPO-AllRE =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-Entered =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminBPO-Pending =================
SELECT CollateralInfo.MWPropertyNo,Format([RelPrin],"$#,##0"),CollateralInfo.OwnerName,CollateralInfo.IsRealEstate,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblBPO.Status,Count(tblBPO.MWPropertyNo),tblBPO.BPOProvider,qrytblLoanLinkToCollateral.RelPrin,CollateralInfo.SellerAppraisedValue,CollateralInfo.LienPosition,Format([VendorOrderDt],'mm/dd/yy') FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblBPO],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-Canceled =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-FollowUp =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral],[xtblTitleSponsor] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryAdminTitle-Ordered =================
SELECT CollateralInfo.MWPropertyNo,CollateralInfo.OwnerName,CollateralInfo.Address,CollateralInfo.City,CollateralInfo.State,CollateralInfo.Zip,CollateralInfo.County,CollateralInfo.TaxParcelIDNO,CollateralInfo.RealEstateGroup,tblTitle.SourceDate,tblTitle.TitleVendor,tblTitle.Status,Format([RelPrin],'$#,##0'),Format([SellerAppraisedValue],'$#,##0'),CollateralInfo.LienPosition,tblTitle.OrderDate FROM [zxTblLOCALCurrentProject],[CollateralInfo],[tblTitle],[qrytblLoanLinkToCollateral] ORDER BY qrytblLoanLinkToCollateral.RelPrin DESCENDING

-- ================= qryCutOffComparisonOutput =================
SELECT tblLoan.MWLoanNo,tblLoan.RelatedLoans,tblLoan.Pool,tblLoan.ProjectName,tblRelationships.SortNo,tblLoan.BorrowerNm,tblRelationships.ExitCode,tblLoan.PrincipalBalance,tblLoan.InterestBalance,tblLoan.LastPmtDt,tblLoan.DueDt,tblLoan.LastImport,tblLoan.Rate,Null,Null,Null,Null,Null,Null,Null,Null,Null,Null,Null FROM [tblLoan],[zxTblLOCALCurrentProject],[tblRelationships] ORDER BY tblRelationships.SortNo

-- ================= qryPoolLevelCalculations =================
SELECT tblPools.PoolNo,tblPools.ProjectName,Count(tblLoan.MWLoanNo),Sum(tblLoan.PrincipalBalance),Sum((Date()-[DueDt])*[PrincipalBalance]),Sum([PrincipalBalance]*[DueDt]),Sum([PrincipalBalance]*[CurrentMaturityDate]),Sum([PrincipalBalance]*[Rate]) FROM [zxTblLOCALCurrentProject],[tblPools],[tblLoan] ORDER BY Sum(tblLoan.PrincipalBalance) DESCENDING

-- ================= QryPRPoolRelationships =================
SELECT tblLoan.ProjectName,tblLoan.RelatedLoans,tblPools.PrimaryGeogState FROM [tblLoan],[tblPools],[zxTblLOCALCurrentProject]

-- ================= qryUDFPropertyStmtDetail =================
SELECT  FROM

-- ================= zQryCurrentLoanERC =================
SELECT tblProjections.LoanNo,tblProjections.ProjectName,tblProjections.RelatedLoans,tblProjections.Group,tblProjections.Sect,tblProjections.Year,tblProjections.Month,tblProjections.Amount FROM [tblProjections] WHERE (((tblProjections.LoanNo)=Forms!frmLoanView!frmLoanDetail.Form!MWLoanNo) And ((tblProjections.ProjectName)=Forms!frmLoanView!frmLoanDetail.Form!projectname) And ((tblProjections.RelatedLoans)=Forms!frmLoanView!frmLoanDetail.Form!relatedloans)) ORDER BY tblProjections.Year

-- ================= zqryFirstCollateral =================
SELECT CollateralInfo.ProjectName,CollateralInfo.RelatedLoans,Min(CollateralInfo.Priority) FROM [CollateralInfo]

-- ================= zqrySummitImport3ListComps =================
SELECT aaBPO.[Broker Phone],aaBPO.[Broker Company] & "-" & aaBPO.[Broker Name],aaBPO.[Subject Comments] & Chr(10) & Chr(13) & Chr(10) & Chr(13) & aaBPO.[Listing1 Comments] & Chr(10) & Chr(13) & Chr(10) & Chr(13) & aaBPO.[Listing2 Comments] & Chr(10) & Chr(13) & Chr(10) & Chr(13) & aaBPO.[Listing3 Comments] & Chr(10) & Chr(13) & Chr(10) & Chr(13) & aaBPO.[Sale1 Comments] & Chr(10) & Chr(13) & Chr(10) & Chr(13) & aaBPO.[Sale2 Comments] & Chr(10) & Chr(13) & Chr(10) & Chr(13) & aaBPO.[Sale3 Comments] & Chr(10) & Chr(13) & Chr(10) & Chr(13) & aaBPO.[Neighborhood Comments],aaBPO.[Listing3 Distance to Subject],aaBPO.[Listing3 of units],aaBPO.[Listing3 Bedrooms],aaBPO.[Listing3 Full Baths]+(aaBPO.[Listing3 Half Baths]*0.5),aaBPO.[Listing3 Property Type],aaBPO.[Listing3 Sq Ft above Grade],aaBPO.[Listing3 Lot Size],aaBPO.[Listing3 Year Built],aaBPO.[Listing3 Condition],aaBPO.[Listing3 Days on Market],aaBPO.[Listing3 Last List Price],aaBPO.[Listing2 Distance to Subject],aaBPO.[Listing2 of units],aaBPO.[Listing2 Bedrooms],aaBPO.[Listing2 Full Baths]+(aaBPO.[Listing2 Half Baths]*0.5),aaBPO.[Listing2 Property Type],aaBPO.[Listing2 Sq Ft above Grade],aaBPO.[Listing2 Lot Size],aaBPO.[Listing2 Year Built],aaBPO.[Listing2 Condition],aaBPO.[Listing2 Days on Market],aaBPO.[Listing2 Last List Price],aaBPO.[Distance to Subject],aaBPO.[Listing1 of units],aaBPO.[Listing1 Bedrooms],aaBPO.[Listing1 Full Baths]+(aaBPO.[Listing1 Half Baths]*0.5),aaBPO.[Listing1 Property Type],aaBPO.[Listing1 Sq Ft above Grade],aaBPO.[Listing1 Lot Size],aaBPO.[Listing1 Year Built],aaBPO.[Listing1 Condition],aaBPO.[Listing1 Days on Market],aaBPO.[Listing1 Last List Price] FROM [tblBPO],[aaBPO]

-- ================= ZZZQryBPOImportID =================
SELECT tblBPO.RelatedLoans,tblBPO.BPOBroker,tblBPO.MWPropertyNo,[Relatedloans] & "-" & [MWPropertyNo] & "-" & [BPOBroker],tblBPO.BPOOrderNum FROM [tblBPO] WHERE (((tblBPO.BPOOrderNum) Is Null))

-- ================= zzzQryTableListforLinkUpdates =================
SELECT MSysObjects.Name,MSysObjects.Type,Mid([Connect],InStr([Connect],"DSN="),InStr(InStr([connect],"DSN="),[Connect],";")-InStr([Connect],"DSN=")),Mid([Connect],InStr([Connect],"Description="),InStr(InStr([connect],"Description="),[Connect],";")-InStr([Connect],"Description=")),Mid([Connect],InStr([Connect],"Trusted_Connection="),IIf(InStr(InStr([connect],"Trusted_Connection="),[Connect],";")=0,Len([Connect])+1,InStr(InStr([connect],"Trusted_Connection="),[Connect],";"))-InStr([Connect],"Trusted_Connection=")),Mid([Connect],InStr([Connect],"APP="),InStr(InStr([connect],"APP="),[Connect],";")-InStr([Connect],"APP=")),IIf(InStr([Connect],"WSID=")>0,Mid([Connect],InStr([Connect],"WSID="),InStr(InStr([connect],"WSID="),[Connect],";")-InStr([Connect],"WSID=")),""),Mid([Connect],InStr([Connect],"DATABASE="),InStr(InStr([connect],"DATABASE="),[Connect],";")-InStr([Connect],"DATABASE=")),MSysObjects.Connect,MSysObjects.ForeignName,MSysObjects.Id,Mid([Connect],InStr([Connect],"Encrypt="),IIf(InStr(InStr([connect],"Encrypt="),[Connect],";")=0,Len([Connect])+1,InStr(InStr([connect],"Encrypt="),[Connect],";"))-InStr([Connect],"Encrypt=")),Mid([Connect],InStr([Connect],"TrustServerCertificate="),IIf(InStr(InStr([connect],"TrustServerCertificate="),[Connect],";")=0,Len([Connect])+1,InStr(InStr([connect],"TrustServerCertificate="),[Connect],";"))-InStr([Connect],"TrustServerCertificate=")) FROM [MSysObjects] WHERE (((MSysObjects.Type)=4) AND ((Mid([Connect],InStr([Connect],"DSN="),InStr(InStr([connect],"DSN="),[Connect],";")-InStr([Connect],"DSN=")))="DSN=sqlDueDiligence") AND ((Left([Name],1))<>"~") AND ((Left([Name],4))<>"MSys")) ORDER BY MSysObjects.Name

-- ================= ~sq_cfrmLoanView~sq_clstFinancial =================
SELECT tblBorrowers.RelatedLoans,tblBorrowers.BorrowerID,tblBorrowers.ProjectName,tblBorrowers.BorrName,tblBorrowers.SSN,tblBorrowers.DOB,tblBorrowers.BeaconScore,tblBorrowers.IsBusiness FROM [tblBorrowers] WHERE (((tblBorrowers.RelatedLoans)=Forms!frmLoanView!RelatedLoans) And ((tblBorrowers.ProjectName)=Forms!frmLoanView!ProjectName))

-- ================= ~sq_rrptZFilteredMaster =================
SELECT tblRelationships.RelatedLoans,tblRelationships.ProjectName,tblRelationships.SortNo,tblRelationships.RelationshipOverview,tblRelationships.CollateralOverview,tblRelationships.ExitStrategyOverview,tblRelationships.ExitCode,tblLoan.Pool,tblLoan.MWLoanNo,tblLoan.PrincipalBalance,tblRelationships.InBankruptcy,tblRelationships.ForeclosureFlag,tblRelationships.LitigationFlag,tblRelationships.ForbearanceFlag,tblRelationships.JudgmentFlag FROM [zxtblFilterMasterRpt],[tblRelationships],[tblLoan] ORDER BY tblRelationships.SortNo

-- ================= ~sq_ffrmBPOInput =================
SELECT tblBPO.Priority,tblBPO.BPODate,tblBPO.BPOBroker,tblBPO.ProjectName,tblBPO.RelatedLoans,tblBPO.MWPropertyNo,tblBPO.Sale1Address,tblBPO.Sale1City,tblBPO.Sale1State,tblBPO.Sale1Zip,tblBPO.Sale2Address,tblBPO.Sale2City,tblBPO.Sale2State,tblBPO.Sale2Zip,tblBPO.Sale3Address,tblBPO.Sale3City,tblBPO.Sale3State,tblBPO.Sale3Zip,tblBPO.List1Address,tblBPO.List1City,tblBPO.List1State,tblBPO.List1Zip,tblBPO.List2Address,tblBPO.List2City,tblBPO.List2State,tblBPO.List2Zip,tblBPO.List3Address,tblBPO.List3City,tblBPO.List3State,tblBPO.List3Zip,tblBPO.Status,tblBPO.MWLoanNo,tblBPO.VendorNo,tblBPO.VendorOrderDt,tblBPO.CancelDate,tblBPO.DeliveryDate,tblBPO.BPOProvider,tblBPO.BPOOrderNum,tblBPO.MWAccntOfficer,tblBPO.Address,tblBPO.City,tblBPO.State,tblBPO.County,tblBPO.ZIP,tblBPO.ParcelNum,tblBPO.SubjUnits,tblBPO.SubjBr,tblBPO.SubjBa,tblBPO.SubjCond,tblBPO.SubjDOM,tblBPO.SubjBldgArea,tblBPO.SubjUse,tblBPO.SubjLandArea,tblBPO.SubjYrBuilt,tblBPO.SubjOccup,tblBPO.SubjPPSqft,tblBPO.SubjSalePrice,tblBPO.SubjQuickSale,tblBPO.SubjListPrice,tblBPO.SubjIsListed,tblBPO.SubjIsListedForPrice,tblBPO.SubjRentSF,tblBPO.SubjNOI,tblBPO.MktRentLow,tblBPO.MktRentHigh,tblBPO.MktVacancyRate,tblBPO.MktType,tblBPO.MktDOM,tblBPO.MktValues,tblBPO.MktTime,tblBPO.Sale1Distance,tblBPO.Sale1Units,tblBPO.Sale1Br,tblBPO.Sale1Ba,tblBPO.Sale1Use,tblBPO.Sale1BldgSize,tblBPO.Sale1LandAc,tblBPO.Sale1YrBuilt,tblBPO.Sale1Cond,tblBPO.Sale1DOM,tblBPO.Sale1List,tblBPO.Sale1Sale,tblBPO.Sale1SaleDt,tblBPO.Sale1RentSF,tblBPO.Sale1NOI,tblBPO.Sale1PPSF,tblBPO.Sale2Distance,tblBPO.Sale2Units,tblBPO.Sale2Br,tblBPO.Sale2Ba,tblBPO.Sale2Use,tblBPO.Sale2BldgSize,tblBPO.Sale2LandAc,tblBPO.Sale2YrBuilt,tblBPO.Sale2Cond,tblBPO.Sale2DOM,tblBPO.Sale2List,tblBPO.Sale2Sale,tblBPO.Sale2SaleDt,tblBPO.Sale2RentSF,tblBPO.Sale2NOI,tblBPO.Sale2PPSF,tblBPO.Sale3Distance,tblBPO.Sale3Units,tblBPO.Sale3Br,tblBPO.Sale3Ba,tblBPO.Sale3Use,tblBPO.Sale3BldgSize,tblBPO.Sale3LandAc,tblBPO.Sale3YrBuilt,tblBPO.Sale3Cond,tblBPO.Sale3DOM,tblBPO.Sale3List,tblBPO.Sale3Sale,tblBPO.Sale3SaleDt,tblBPO.Sale3RentSF,tblBPO.Sale3NOI,tblBPO.Sale3PPSF,tblBPO.List1Distance,tblBPO.List1Units,tblBPO.List1Br,tblBPO.List1Ba,tblBPO.List1Use,tblBPO.List1BldgSize,tblBPO.List1LandAc,tblBPO.List1YrBuilt,tblBPO.List1Cond,tblBPO.List1DOM,tblBPO.List1List,tblBPO.List1RentSF,tblBPO.List1NOI,tblBPO.List1PPSF,tblBPO.List2Distance,tblBPO.List2Units,tblBPO.List2Br,tblBPO.List2Ba,tblBPO.List2Use,tblBPO.List2BldgSize,tblBPO.List2LandAc,tblBPO.List2YrBuilt,tblBPO.List2Cond,tblBPO.List2DOM,tblBPO.List2List,tblBPO.List2RentSF,tblBPO.List2NOI,tblBPO.List2PPSF,tblBPO.List3Distance,tblBPO.List3Units,tblBPO.List3Br,tblBPO.List3Ba,tblBPO.List3Use,tblBPO.List3BldgSize,tblBPO.List3LandAc,tblBPO.List3YrBuilt,tblBPO.List3Cond,tblBPO.List3DOM,tblBPO.List3List,tblBPO.List3RentSF,tblBPO.List3NOI,tblBPO.List3PPSF,tblBPO.BPONarrative,tblBPO.BPOAgency,tblBPO.BPOPhone,tblBPO.AdminComment,tblBPO.LastModifiedDate FROM [tblBPO] WHERE (((tblBPO.BPOBroker)=Forms!frmLoanview.txtBPODuplicate) And ((tblBPO.ProjectName)=Forms!frmLoanview.ProjectName) And ((tblBPO.RelatedLoans)=Forms!frmLoanview.RelatedLoans) And ((tblBPO.MWPropertyNo)=Forms!frmLoanview.txtMWPropertyNo))
