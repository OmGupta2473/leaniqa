import re

with open('src/features/auth/pages/AuthPage.tsx', 'r') as f:
    content = f.read()

start_index = content.find('          ) : (\n<> <div className="space-y-4">')
if start_index == -1:
    start_index = content.find('          ) : (<div className="space-y-4">')

end_index = content.find('          {/* Footer */}')

if start_index != -1 and end_index != -1:
    # Just grab everything between start and end and rebuild it
    new_code = """          ) : (
            <div className="w-full">
              <div className="space-y-4">
                <motion.button 
                    whileHover={hover.subtle}
                    whileTap={tap.scale}
                    onClick={() => handleOAuthLogin('google')}
                    disabled={loading}
                    className="btn-ghost w-full"
                >
                    <GoogleIcon className="w-5 h-5 shrink-0" /> Continue with Google
                </motion.button>
                
                <motion.button 
                    whileHover={hover.subtle}
                    whileTap={tap.scale}
                    onClick={() => toast({ type: 'info', message: 'This feature is currently unavailable.' })}
                    disabled={loading}
                    className="btn-ghost w-full opacity-50 cursor-not-allowed"
                >
                    <Apple className="w-5 h-5 shrink-0" fill="currentColor" strokeWidth={0} /> Continue with Apple
                </motion.button>
              </div>

              {showEmailSuggestion && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 border border-[rgba(212,255,0,0.25)] bg-[rgba(212,255,0,0.1)] text-[#D4FF00] p-3 rounded-[20px] text-[14px] text-center font-medium"
                >
                  Having trouble with Google? Try email sign-in below.
                </motion.div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-[0.5px] bg-[rgba(255,255,255,0.18)]"></div>
                <div className="text-[11px] font-semibold text-[rgba(255,255,255,0.18)] uppercase tracking-wide whitespace-nowrap">OR CONTINUE WITH</div>
                <div className="flex-1 h-[0.5px] bg-[rgba(255,255,255,0.18)]"></div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                {!isOtpSent ? (
                    <>
                      <div>
                          <label htmlFor="email-input" className="sr-only">Email address</label>
                          <input
                            id="email-input"
                            type="email"
                            placeholder="Enter your email"
                            aria-label="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={(e) => {
                              const target = e.target as HTMLInputElement;
                              setTimeout(() => {
                                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 300);
                            }}
                            disabled={loading}
                            className="input-apple min-h-[44px]"
                            required
                          />
                      </div>
                      <motion.button 
                          whileHover={hover.glow}
                          whileTap={tap.scale}
                          type="submit" 
                          disabled={loading || !email}
                          className="btn-primary w-full disabled:opacity-50"
                      >
                          {loading ? 'Sending link...' : 'Continue with Email'}
                      </motion.button>
                    </>
                ) : (
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-4 py-2"
                  >
                      <div className="w-16 h-16 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center mx-auto border border-[rgba(212,255,0,0.2)]">
                        <Mail className="w-8 h-8 text-[#D4FF00]" />
                      </div>
                      <div>
                          <h3 className="text-[22px] font-bold text-white mb-2 tracking-tight">Check your inbox</h3>
                          <p className="text-[15px] text-[rgba(255,255,255,0.55)] leading-relaxed">
                            We sent a secure link to <br/><span className="text-white break-all">{email}</span>
                          </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsOtpSent(false); }}
                        className="text-[14px] text-[#D4FF00] font-semibold hover:opacity-80 transition-opacity mt-4 bg-[rgba(212,255,0,0.1)] px-5 py-2.5 min-h-[44px] rounded-full"
                      >
                        Use a different email
                      </button>
                  </motion.div>
                )}
              </form>
            </div>
          )}
"""
    
    content = content[:start_index] + new_code + content[end_index:]
    with open('src/features/auth/pages/AuthPage.tsx', 'w') as f:
        f.write(content)
    print("Replaced section successfully")
else:
    print(f"Could not find start/end indices. Start: {start_index}, End: {end_index}")

