onClick = {() => handleDownloadQuote(getCurrentQuoteForExport())}
className = "w-full text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl"
style = {{ backgroundColor: themeAccent, boxShadow: `0 10px 15px -3px ${themeAccent}44` }}
                   >
  <Download size={18} /> Download Generated PDF
                   </button >

  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => handleDownloadQuote(getCurrentQuoteForExport())}
      className="bg-white border-2 border-gray-100 text-gray-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95"
    >
      <Printer size={16} /> Print View
    </button>
    <button
      onClick={() => {
        const quote = getCurrentQuoteForExport();
        handleDownloadQuote(quote);
        // Auto trigger print in modal logic if possible, 
        // but our modal has its own print button which is safer.
      }}
      className="bg-gray-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
    >
      <Maximize2 size={16} /> Full Preview
    </button>
  </div>
                </div >
              </div >
            </div >
          </div >
        </div >
      )}

{/* Front Page Settings Modal (Localized State) */ }
<FrontPageSettingsDrawer
  isOpen={isFrontPageModalOpen}
  onClose={() => setIsFrontPageModalOpen(false)}
  initialSettings={frontPageSettings}
  onSave={(settings) => {
    setFrontPageSettings(settings);
    toast.success("Settings updated!");
  }}
  selectedStates={selectedStates}
  selectedDistricts={selectedDistricts}
  states={states}
  districts={districts}
  quoteCount={quotes.length}
  solarSettings={solarSettings}
  filters={filters}
  quotes={quotes}
/>



{/* Professional Page Configuration Modal (Localized State to prevent main refresh) */ }
<PageConfigDrawer
  isOpen={isPageModalOpen}
  onClose={() => setIsPageModalOpen(false)}
  activePage={activeEditingPage}
  initialConfig={tempPageConfig}
  onSave={(config) => {
    setPageConfigs({ ...pageConfigs, [activeEditingPage.value]: config });
  }}
  onLiveChange={(config) => {
    setPageConfigs({ ...pageConfigs, [activeEditingPage.value]: config });
  }}
  quoteType={quoteTypesSelected[0]}
  advancedOptions={advancedOptions}
  setAdvancedOptions={setAdvancedOptions}
  dbAmcServices={dbAmcServices}
/>

{/* Quote Download / Print Modal */ }
<QuoteDownloadModal
  isOpen={isDownloadModalOpen}
  onClose={() => { setIsDownloadModalOpen(false); setDownloadQuote(null); }}
  quote={downloadQuote}
/>
